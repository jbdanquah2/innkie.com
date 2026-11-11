#!/usr/bin/env python3
"""
One-off migration helper: converts the *static* part of an Angular inline template to JSX.

  ng2jsx.py <component.ts> <start-marker> <out.tsx> <ComponentName> [--keep-tail N] [--end-marker TEXT] [--back N]

- Reads the inline `template:` literal of the component.
- Starts at the first line containing <start-marker> and runs to the end of the template,
  minus the last N closing wrapper lines (default 2 `</div>`s that close the page wrappers).
- Converts plain markup: class->className, <a routerLink> -> <Link href>, comments, style strings,
  void tags, JSX-unsafe characters, <pre> bodies, <app-ad-slot/guide-callout/related-tools>.
- Anything that needs real logic (*ngIf, @for, {{ }}, [bindings], (events)) is NOT converted: the
  line is reported and a `{/* TODO(ng2jsx) */}` marker is emitted so it gets hand-ported.
"""
import re
import sys

VOID = {"br", "hr", "img", "input", "meta", "link", "source", "wbr", "col"}
SVG_ATTR = {"viewbox": "viewBox", "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap",
            "stroke-linejoin": "strokeLinejoin", "fill-rule": "fillRule", "clip-rule": "clipRule",
            "fill-opacity": "fillOpacity", "stroke-opacity": "strokeOpacity"}
ATTR_MAP = {"class": "className", "for": "htmlFor", "colspan": "colSpan", "rowspan": "rowSpan",
            "tabindex": "tabIndex", "autocomplete": "autoComplete", "maxlength": "maxLength",
            "readonly": "readOnly", "crossorigin": "crossOrigin", "srcset": "srcSet"}

TAG_RE = re.compile(r'<!--.*?-->|</?[a-zA-Z][^>"\']*(?:"[^"]*"|\'[^\']*\'|[^>"\'])*>', re.S)
ATTR_RE = re.compile(r'([^\s=/>]+)(?:\s*=\s*("([^"]*)"|\'([^\']*)\'))?')

problems = []


def extract_template(src):
    m = re.search(r"template:\s*`", src)
    if not m:
        sys.exit("no inline template found")
    start = m.end()
    end = src.index("`,\n  styles", start) if "`,\n  styles" in src[start:] else src.index("\n  `", start)
    return src[start:end]


def style_to_obj(s):
    items = []
    for decl in filter(None, (d.strip() for d in s.split(";"))):
        k, _, v = decl.partition(":")
        k = k.strip()
        if k.startswith("--"):
            key = f"'{k}'"
        else:
            key = re.sub(r"-([a-z])", lambda m: m.group(1).upper(), k)
        items.append(f"{key}: {v.strip()!r}".replace('"', "'"))
    return "{{ " + ", ".join(items) + " }}"


def needs_logic(attr_name, value):
    return (attr_name.startswith(("*ng", "[", "(", "#", "@")) or "{{" in (value or ""))


def convert_tag(tag, lineno, stack):
    closing = tag.startswith("</")
    name_m = re.match(r"</?([a-zA-Z][\w-]*)", tag)
    name = name_m.group(1)

    if closing:
        if stack and stack[-1][0] == name:
            _, jsx = stack.pop()
            return f"</{jsx}>"
        if name in ("app-ad-slot", "app-guide-callout", "app-related-tools"):
            return ""  # emitted as self-closing JSX
        return f"</{name}>"

    self_close = tag.endswith("/>")
    body = tag[name_m.end(): -2 if self_close else -1]
    attrs = []
    href = None
    logic = False
    for m in ATTR_RE.finditer(body):
        an, full, v1, v2 = m.group(1), m.group(2), m.group(3), m.group(4)
        val = v1 if v1 is not None else v2
        if needs_logic(an, val):
            logic = True
            continue
        if an == "routerLink":
            href = val
            continue
        if an == "style" and val is not None:
            attrs.append(f"style={style_to_obj(val)}")
            continue
        key = ATTR_MAP.get(an) or SVG_ATTR.get(an.lower()) or an
        if val is None:
            attrs.append(key)
        elif "{" in val or "}" in val:
            attrs.append(f"{key}={{{val!r}}}")
        else:
            q = '"' if '"' not in val else "'"
            attrs.append(f"{key}={q}{val}{q}")
    if logic:
        problems.append((lineno, tag.strip()[:100]))

    jsx = name
    extra = ""
    if name == "a" and href is not None:
        jsx = "Link"
        h = href if href.endswith("/") or "?" in href or "#" in href else href + "/"
        extra = f' href="{h}"'
    elif name == "a":
        # external anchors: keep, make safe
        if any(a.startswith("target=") for a in attrs) and not any(a.startswith("rel=") for a in attrs):
            attrs.append('rel="noopener noreferrer"')
    elif name == "app-ad-slot":
        jsx = "AdSlot"
        attrs = [a.replace("slotId=", "slotId=") for a in attrs if not a.startswith("className")]
        self_close = True
    elif name == "app-guide-callout":
        jsx = "GuideCallout"
        attrs = [a.replace("toolRoute=", "toolRoute=") for a in attrs if not a.startswith("className")]
        self_close = True
    elif name == "app-related-tools":
        jsx = "RelatedTools"
        attrs = [re.sub(r'maxTools="(\d+)"', r"maxTools={\1}", a) for a in attrs]
        self_close = True
    elif name.startswith("app-"):
        problems.append((lineno, f"unknown component <{name}>"))

    attr_str = (" " + " ".join(attrs)) if attrs else ""
    if name in VOID or self_close:
        return f"<{jsx}{extra}{attr_str} />"
    stack.append((name, jsx))
    return f"<{jsx}{extra}{attr_str}>"


def convert_text(text, lineno, in_pre):
    if in_pre:
        return text  # handled by caller
    # Angular escapes
    text = text.replace("{{ '{' }}", "{'{'}").replace("{{ '}' }}", "{'}'}")
    if "{{" in text or re.search(r"^\s*@(if|for|else|switch|case|default)\b", text, re.M):
        problems.append((lineno, "interpolation/control flow in text"))
        return "{/* TODO(ng2jsx): needs logic */}"
    out = []
    i = 0
    while i < len(text):
        if text.startswith("{'{'}", i) or text.startswith("{'}'}", i):
            out.append(text[i:i + 5]); i += 5; continue
        c = text[i]
        out.append({"{": "{'{'}", "}": "{'}'}", ">": "&gt;", "<": "&lt;"}.get(c, c))
        i += 1
    return "".join(out)


def convert(html):
    stack = []
    out = []
    pos = 0
    pre_depth = 0
    pre_buf = []
    for m in TAG_RE.finditer(html):
        text = html[pos:m.start()]
        lineno = html.count("\n", 0, m.start()) + 1
        tag = m.group(0)
        if pre_depth:
            pre_buf.append(text)
        else:
            out.append(convert_text(text, lineno, False))
        pos = m.end()

        if tag.startswith("<!--"):
            inner = tag[4:-3].replace("*/", "* /")
            (pre_buf if pre_depth else out).append("{/*" + inner + "*/}")
            continue

        if tag.startswith("</"):
            name = re.match(r"</([\w-]+)", tag).group(1)
            if name == "pre" and pre_depth:
                pre_depth -= 1
                if pre_depth == 0:
                    raw = "".join(pre_buf)
                    raw = raw.replace("{{ '{' }}", "{").replace("{{ '}' }}", "}")
                    raw = raw.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
                    # undo HTML entities that were only needed in HTML
                    raw = raw.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
                    out.append("{`" + raw + "`}")
                    pre_buf = []
                    out.append(convert_tag(tag, lineno, stack))
                    continue
            (pre_buf if pre_depth else out).append(convert_tag(tag, lineno, stack))
            continue

        name = re.match(r"<([\w-]+)", tag).group(1)
        if name == "pre" and not tag.endswith("/>"):
            pre_depth += 1
            if pre_depth == 1:
                out.append(convert_tag(tag, lineno, stack))
                continue
        (pre_buf if pre_depth else out).append(convert_tag(tag, lineno, stack))
    out.append(convert_text(html[pos:], html.count("\n", 0, pos) + 1, False))
    if stack:
        problems.append((0, f"unclosed tags: {[s[0] for s in stack]}"))
    return "".join(out)


def main():
    args = sys.argv[1:]
    if len(args) < 4:
        sys.exit(__doc__)
    ts_path, marker, out_path, comp = args[:4]
    keep_tail = int(args[args.index("--keep-tail") + 1]) if "--keep-tail" in args else 2
    tpl = extract_template(open(ts_path).read())
    lines = tpl.split("\n")
    start = next(i for i, l in enumerate(lines) if marker in l)
    if "--back" in args:
        start -= int(args[args.index("--back") + 1])
    end = len(lines)
    if "--end-marker" in args:
        em = args[args.index("--end-marker") + 1]
        end = next(i for i, l in enumerate(lines) if i > start and em in l)
    body = lines[start:end]
    # drop trailing blank lines then the wrapper closers
    while body and not body[-1].strip():
        body.pop()
    for _ in range(keep_tail):
        if body and body[-1].strip() == "</div>":
            body.pop()
    jsx = convert("\n".join(body))
    uses = [n for n in ("Link", "AdSlot", "GuideCallout", "RelatedTools") if f"<{n}" in jsx]
    imports = []
    if "Link" in uses: imports.append("import Link from 'next/link';")
    if "AdSlot" in uses: imports.append("import { AdSlot } from '@/components/AdSlot';")
    if "GuideCallout" in uses: imports.append("import { GuideCallout } from '@/components/GuideCallout';")
    if "RelatedTools" in uses: imports.append("import { RelatedTools } from '@/components/RelatedTools';")
    header = "// Generated by scripts/ng2jsx.py from the Angular template, then reviewed by hand.\n"
    open(out_path, "w").write(
        f"{header}{chr(10).join(imports)}\n\nexport function {comp}() {{\n  return (\n    <>\n{jsx}\n    </>\n  );\n}}\n")
    print(f"wrote {out_path}: {len(body)} template lines")
    if problems:
        print(f"{len(problems)} spot(s) need hand-porting:")
        for ln, t in problems:
            print(f"  segment line {ln}: {t}")


if __name__ == "__main__":
    main()
