#!/usr/bin/env python3
"""Assemble the vibe-check interactive PRD (self-contained HTML) into $TMPDIR."""

from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

SKILL = Path("/Users/malithi/.agents/skills/vibe-check")
DIAG = SKILL / "assets/diagrams"
PLAN = Path("/Users/malithi/Vibe_Code/Cursor Projects/competitive-launch-watcher/docs/VIBE-CHECK-PLAN.md")
ENGINE_CSS = (DIAG / "engine.css").read_text()


def shim(data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"""<script>
window.__D__ = {payload};
const _fetch = window.fetch.bind(window);
window.fetch = async (url, opts) => {{
  const u = String(url);
  if (u.includes("data-") && u.includes(".json")) {{
    return new Response(JSON.stringify(window.__D__), {{
      headers: {{ "Content-Type": "application/json" }},
    }});
  }}
  return _fetch(url, opts);
}};
</script>"""


def bake_renderer(filename: str, data: dict) -> str:
    html = (DIAG / filename).read_text()
    html = html.replace(
        '<link rel="stylesheet" href="engine.css">',
        f"<style>{ENGINE_CSS}</style>",
    )
    return html.replace("</head>", shim(data) + "\n</head>")


def srcdoc(html: str) -> str:
    return html.replace("&", "&amp;").replace('"', "&quot;")


def board_iframe(html: str, height: int) -> str:
    return (
        f'<div class="board" style="height:{height}px">'
        f'<iframe srcdoc="{srcdoc(html)}" style="height:{int(height / 0.5625)}px"></iframe>'
        f"</div>"
    )


OPPORTUNITY = {
    "header": {
        "crumb": "Discovery · Opportunity scoring",
        "title": "The Opportunity Map",
        "sub": "Directional from this session — not a Reddit sweep. Hunches until Phase 0 proves Grok search.",
    },
    "axes": {
        "y": {"label": "How much it hurts", "high": "a lot", "low": "a little"},
        "x": {
            "label": "How well today's tools already handle it",
            "low": "badly",
            "high": "well",
        },
    },
    "quadrants": {
        "gap": {"title": "◆ The gap, build here", "tone": "win"},
        "stakes": {"title": "Table stakes, just match it", "tone": "stakes"},
        "niche": {"title": "Niche, maybe later", "tone": "low"},
        "low": {"title": "Low priority, leave it", "tone": "low"},
    },
    "needs": [
        {
            "id": "catch",
            "label": "Catch launches without living on X",
            "kicker": "the job",
            "pain": 9,
            "served": 3,
            "score": 15,
            "evidence": "hunch",
        },
        {
            "id": "discover",
            "label": "See companies in an industry I don't already know",
            "kicker": "the differentiator",
            "pain": 8,
            "served": 2,
            "score": 14,
            "evidence": "hunch",
        },
        {
            "id": "noken",
            "label": "Get a feed without becoming an API developer",
            "pain": 8,
            "served": 2,
            "score": 14,
            "evidence": "seen",
        },
        {
            "id": "ping",
            "label": "Get interrupted at work (Slack), not only in a dashboard",
            "pain": 8,
            "served": 4,
            "score": 12,
            "evidence": "hunch",
        },
        {
            "id": "feed",
            "label": "Scan a dense scored alert feed",
            "pain": 6,
            "served": 7,
            "score": 6,
            "evidence": "seen",
        },
    ],
    "winner": {
        "label": "Catch launches without living on X",
        "meta": "Opportunity 15 · via industry pick, 10 watches, Grok ingest, Slack.",
    },
    "formula": "Opportunity = Pain + max(0, Pain − Served)",
    "evidenceLegend": [
        {"type": "seen", "label": "Seen it in this session (no X bearer; v1 feed exists)"},
        {"type": "hunch", "label": "Hunch — plan-only, not a Reddit sweep"},
    ],
}

MATRIX = {
    "header": {
        "crumb": "Discovery · Competitor matrix",
        "title": "What people use instead",
        "sub": "Rows are needs. Columns are today's workarounds. A row everyone fails is the gap.",
    },
    "cornerLabel": "The need ↓ / How they do →",
    "competitors": [
        {"name": "Manual X scrolling"},
        {"name": "Google Alerts", "sub": "+ news"},
        {"name": "Brandwatch / Meltwater"},
        {"name": "Launch Watcher v1", "sub": "seed demo"},
    ],
    "needs": [
        {
            "label": "Catch launches without living on X",
            "type": "gap",
            "tag": "◆ your gap",
            "marks": ["poor", "poor", "well", "poor"],
        },
        {
            "label": "Discover unknown competitors",
            "type": "gap",
            "tag": "◆ differentiator",
            "marks": ["none", "none", "poor", "none"],
        },
        {
            "label": "No API homework",
            "type": "gap",
            "marks": ["well", "well", "poor", "poor"],
        },
        {
            "label": "Ping at work (Slack)",
            "type": "stakes",
            "tag": "table stakes soon",
            "marks": ["none", "poor", "well", "none"],
        },
        {
            "label": "Scored alert feed",
            "type": "stakes",
            "tag": "v1 already",
            "marks": ["none", "none", "well", "well"],
        },
    ],
    "legend": [
        {"mark": "well", "label": "Does it well"},
        {"mark": "poor", "label": "Does it poorly"},
        {"mark": "none", "label": "Doesn't do it"},
    ],
    "callout": "v1 already scores posts. The hole is login, any-industry watches, and a Slack ping.",
}

STORY = {
    "header": {
        "crumb": "Phase 2 · Story map",
        "title": "Launch Watcher, first session",
        "sub": "Read left to right. Ship the green band. That row alone is a daily-use product.",
    },
    "activities": [
        {"step": 1, "name": "Continue with X"},
        {"step": 2, "name": "Pick industry"},
        {"step": 3, "name": "Pick up to 10 accounts"},
        {"step": 4, "name": "See your alerts"},
        {"step": 5, "name": "Add to Slack"},
        {"step": 6, "name": "Get a launch ping"},
    ],
    "releases": [
        {
            "id": "v1",
            "label": "V1 · usable every day",
            "tape": "green",
            "subnote": "this slice",
            "skeleton": "ship just this row",
            "band": True,
        },
        {
            "id": "v2",
            "label": "V2 · pay + more channels",
            "tape": "blue",
            "subnote": "once V1 works",
        },
        {"id": "later", "label": "Later", "tape": "kraft"},
    ],
    "cells": {
        "v1": {
            "1": [{"kicker": "Do", "text": "Continue with X (official login)", "color": "g", "pin": True}],
            "2": [
                {
                    "kicker": "Do",
                    "text": "Type industry + chips",
                    "color": "g",
                    "aha": True,
                }
            ],
            "3": [
                {
                    "kicker": "AI",
                    "text": "Top 5 checked · search · find unknown · cap 10",
                    "color": "ai",
                    "aha": True,
                }
            ],
            "4": [{"kicker": "Do", "text": "Feed = only your watches", "color": "g"}],
            "5": [{"kicker": "Do", "text": "Add to Slack, one channel", "color": "b"}],
            "6": [
                {
                    "kicker": "Do",
                    "text": "Launch-only ping · quiet hours on",
                    "color": "b",
                }
            ],
        },
        "v2": {
            "3": [{"kicker": "Pay", "text": "More than 10 accounts", "color": "o", "size": "sm"}],
            "5": [{"kicker": "Later", "text": "WhatsApp / webhook", "color": "y", "size": "sm"}],
            "6": [{"kicker": "AI", "text": "LLM classifier", "color": "ai", "size": "sm"}],
        },
        "later": {
            "4": [{"kicker": "Idea", "text": "Public digest pages (content loop)", "color": "y", "size": "sm"}],
            "6": [{"kicker": "Idea", "text": "LinkedIn / news", "color": "y", "size": "sm"}],
        },
    },
}

BLUEPRINT = {
    "state": "future",
    "offering": "Competitive Launch Watcher",
    "scenario": "First session: industry → 10 watches → Slack launch ping",
    "explainer": {
        "title": "The aha is the picker, not the card",
        "body": "They type an industry, see five companies already checked (including names they did not know they could add), cap at 10, then Slack carries the launch so they do not live on X.",
        "read": "Hidden steps (black) are backstage: Grok search and the 30-minute timer.",
    },
    "phases": [
        {"name": "Join", "from": 1, "to": 1},
        {"name": "Choose", "from": 2, "to": 3},
        {"name": "Watch", "from": 4, "to": 5},
        {"name": "Ping", "from": 6, "to": 7},
    ],
    "steps": [
        {"n": 1, "name": "Continue with X", "def": "X confirms who they are", "hidden": False},
        {"n": 2, "name": "Name the industry", "def": "Type or tap a chip", "hidden": False},
        {"n": 3, "name": "Pick accounts", "def": "Top 5 on, search, discover, max 10", "hidden": False},
        {"n": 4, "name": "Grok looks at X", "def": "x_search on those handles", "hidden": True},
        {"n": 5, "name": "Your alert feed", "def": "Only their watches, scored", "hidden": False},
        {"n": 6, "name": "Add to Slack", "def": "Pick one channel", "hidden": False},
        {"n": 7, "name": "Launch ping", "def": "If not quiet hours", "hidden": False},
    ],
    "layers": {
        "touchpoint": {
            "1": "Continue with X button",
            "2": "Industry field + chips",
            "3": "Checked rows, search, Find companies I don't know",
            "5": "Alert cards · Seen · Dismiss · Open on X",
            "6": "Add to Slack",
            "7": "Slack message with Open on X",
        },
        "roles": {
            "1": "Operator + X",
            "3": "Operator + Grok suggesting",
            "4": "Grok + classifier",
            "6": "Operator + Slack workspace",
        },
        "process": {
            "1": "Create user from X id",
            "3": "Create/link competitors; enforce 10",
            "4": "Cron batches handles; upsert posts",
            "7": "Skip Slack if quiet hours",
        },
        "technology": {
            "1": "Auth.js + X OAuth",
            "3": "xAI Grok for suggestions",
            "4": "Vercel Cron + x_search + classifyPost",
            "5": "Postgres + existing UI",
            "6": "Official Slack OAuth",
        },
        "policy": {
            "3": "Hard cap 10 · no Stripe yet",
            "7": "Launch-only pings",
            "1": "Privacy policy before other people log in",
        },
        "pitfall": {
            "1": "X app review delay",
            "3": "Grok invents fake @handles",
            "4": "Token spend if we don't batch",
            "7": "Too many pings → mute",
        },
        "rationale": {
            "1": "Everyone logs in with X, no bearer paste",
            "3": "Top 5 checked because they asked for fast",
            "4": "No X bearer → Grok search",
            "7": "Slack only — they chose not WhatsApp",
        },
        "question": {
            "4": "Does Phase 0 Grok test pass?",
            "1": "Will X approve the login app?",
        },
        "note": {
            "5": "v1 feed already exists — scope it per user",
            "3": "Voice AI seed becomes a chip, not the whole product",
        },
    },
}

CRAZY8 = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Launch Watcher Crazy 8</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>{ENGINE_CSS}</style>
<style>
  :root{{ --win-bar:#ECECEA; --ph:#dededa; --ph-tx:#9a9a93; --win-border:#1A1A1B; }}
  .stage{{padding:32px 48px 22px;}}
  .head .crumb{{color:var(--blue);}}
  .madeby2{{position:absolute;right:48px;top:38px;font-size:14px;color:var(--ink-muted);text-decoration:none;}}
  .madeby2 b{{color:var(--blue);font-weight:700;}}
  .board{{flex:1;display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);gap:22px 28px;margin-top:14px;min-height:0;}}
  .card{{display:flex;flex-direction:column;gap:9px;min-height:0;}}
  .dir{{align-self:flex-start;background:var(--charcoal);color:#fff;font-weight:700;font-size:14px;padding:6px 13px;}}
  .bestfor{{font-size:14px;color:var(--ink-2);font-weight:500;}}
  .bestfor b{{color:var(--charcoal);}}
  .win{{flex:1;background:#fff;border:2px solid var(--win-border);display:flex;flex-direction:column;overflow:hidden;min-height:0;}}
  .winbar{{height:32px;background:var(--win-bar);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;padding:0 12px;}}
  .dots{{display:flex;gap:6px;}} .dots i{{width:10px;height:10px;border-radius:50%;background:#c9c9c5;}}
  .url{{flex:1;height:18px;background:#fff;border:1px solid var(--border);font-size:11px;color:var(--ink-muted);display:flex;align-items:center;padding:0 9px;}}
  .wc{{flex:1;min-height:0;overflow:hidden;padding:12px;}}
  .hero{{font-family:var(--serif);font-size:22px;color:var(--charcoal);margin-bottom:10px;}}
  .box{{border:1.5px solid var(--charcoal);padding:8px 10px;font-size:13px;color:var(--ink-muted);margin-bottom:8px;}}
  .chiprow{{display:flex;gap:6px;flex-wrap:wrap;}}
  .chipx{{background:#eef0f3;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;}}
  .row{{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;}}
  .ck{{width:14px;height:14px;background:var(--blue);border-radius:2px;}}
  .ck.off{{background:#fff;border:1.5px solid var(--charcoal);}}
  .bub{{background:var(--purple-light);border-left:3px solid var(--purple);padding:8px;font-size:12px;margin-bottom:6px;}}
</style>
</head>
<body class="canvas-dots">
<div class="stage">
  <div class="head"><div>
    <div class="crumb">Phase 2 · Crazy 8 · Web app</div>
    <div class="title">Four ways “pick an industry” could feel</div>
    <div class="sub">Desktop frames. We fused type-in + chips + a pre-checked Top 5 — not a chat homework assignment.</div>
  </div></div>
  <a class="madeby2" href="https://github.com/TexasBedouin/vibe-check" target="_blank" rel="noopener">Created using <b>Vibe-Check</b> skill</a>
  <div class="board">
    <div class="card">
      <div class="dir">1 · Type-in hero</div>
      <div class="win"><div class="winbar"><span class="dots"><i></i><i></i><i></i></span><span class="url">launch.watch/onboard</span></div>
      <div class="wc"><div class="hero">What industry should we watch?</div>
      <div class="box">Voice AI _</div>
      <div style="background:var(--blue);color:#fff;display:inline-block;padding:6px 12px;font-size:12px;font-weight:700;">Continue</div>
      </div></div>
      <div class="bestfor"><b>Kept:</b> type anything.</div>
    </div>
    <div class="card">
      <div class="dir">2 · Chip cloud</div>
      <div class="win"><div class="winbar"><span class="dots"><i></i><i></i><i></i></span><span class="url">launch.watch/onboard</span></div>
      <div class="wc"><div class="hero">Or tap one</div>
      <div class="chiprow"><span class="chipx">Voice AI</span><span class="chipx">Dev tools</span><span class="chipx">Climate</span><span class="chipx">Fintech</span></div>
      </div></div>
      <div class="bestfor"><b>Kept:</b> chips if they freeze.</div>
    </div>
    <div class="card">
      <div class="dir">3 · Chat with Grok</div>
      <div class="win"><div class="winbar"><span class="dots"><i></i><i></i><i></i></span><span class="url">launch.watch/chat</span></div>
      <div class="wc"><div class="bub">Tell me who you compete with…</div>
      <div class="bub">Hmm, also watch Cartesia?</div>
      </div></div>
      <div class="bestfor"><b>Dropped:</b> too slow. Discover is a button, not a chat.</div>
    </div>
    <div class="card">
      <div class="dir">4 · Spreadsheet</div>
      <div class="win"><div class="winbar"><span class="dots"><i></i><i></i><i></i></span><span class="url">launch.watch/accounts</span></div>
      <div class="wc">
        <div class="row"><span class="ck"></span> ElevenLabs · @elevenlabsio</div>
        <div class="row"><span class="ck"></span> Hume · @hume_ai</div>
        <div class="row"><span class="ck"></span> OpenAI · @OpenAI</div>
        <div class="row"><span class="ck off"></span> Search more…</div>
      </div></div>
      <div class="bestfor"><b>Kept:</b> Top 5 already checked.</div>
    </div>
  </div>
</div>
</body>
</html>
"""

COMBINE = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Combine</title>
<style>{ENGINE_CSS}</style>
<style>
  .stage{{padding:34px 52px 24px;}}
  .madeby2{{position:absolute;right:52px;top:40px;font-size:14px;color:var(--ink-muted);text-decoration:none;}}
  .madeby2 b{{color:var(--blue);}}
  .flow{{flex:1;display:flex;align-items:stretch;justify-content:center;gap:28px;margin-top:12px;}}
  .win{{flex:1;max-width:720px;background:#fff;border:2px solid var(--charcoal);display:flex;flex-direction:column;overflow:hidden;}}
  .winbar{{height:32px;background:#ECECEA;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 12px;font-size:12px;color:var(--ink-muted);}}
  .wc{{padding:16px;}}
  .hero{{font-family:var(--serif);font-size:26px;}}
  .box{{border:1.5px solid var(--charcoal);padding:8px 10px;margin:10px 0;font-size:14px;}}
  .chiprow{{display:flex;gap:6px;margin-bottom:12px;}}
  .chipx{{background:#eef0f3;font-size:12px;font-weight:700;padding:4px 8px;border-radius:999px;}}
  .row{{display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:14px;}}
  .ck{{width:14px;height:14px;background:var(--blue);}}
  .btns{{display:flex;gap:8px;margin-top:12px;}}
  .btn{{background:var(--blue);color:#fff;font-size:12px;font-weight:700;padding:7px 12px;}}
  .btn.g{{background:#fff;color:var(--charcoal);border:1.5px solid var(--charcoal);}}
  .why{{text-align:center;margin-top:12px;color:var(--ink-2);}}
</style>
</head>
<body class="canvas-dots">
<div class="stage">
  <div class="head"><div>
    <div class="crumb">Phase 2 · The combine</div>
    <div class="title">Type an industry, keep the five, search or discover, cap 10</div>
    <div class="sub">From sketch 1 (type), 2 (chips), and 4 (checked list). Chat was dropped.</div>
  </div></div>
  <a class="madeby2" href="https://github.com/TexasBedouin/vibe-check" target="_blank" rel="noopener">Created using <b>Vibe-Check</b> skill</a>
  <div class="flow">
    <div class="win">
      <div class="winbar">launch.watch · pick accounts</div>
      <div class="wc">
        <div class="hero">Voice AI</div>
        <div class="chiprow"><span class="chipx">Voice AI</span><span class="chipx">Dev tools</span><span class="chipx">Climate</span></div>
        <div class="box">Search company or @handle</div>
        <div class="row"><span class="ck"></span> ElevenLabs @elevenlabsio</div>
        <div class="row"><span class="ck"></span> Hume @hume_ai</div>
        <div class="row"><span class="ck"></span> Deepgram @DeepgramAI</div>
        <div class="row"><span class="ck"></span> OpenAI @OpenAI</div>
        <div class="row"><span class="ck"></span> Vapi @Vapi_AI</div>
        <div class="btns"><span class="btn g">Find companies I don't know</span><span class="btn">Watch these (5 / 10)</span></div>
      </div>
    </div>
  </div>
  <div class="why"><b>Aha:</b> names they didn't know, already checked, one tap to watch.</div>
</div>
</body>
</html>
"""


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def main() -> None:
    plan = PLAN.read_text()
    opp = bake_renderer("opportunity.html", OPPORTUNITY)
    matrix = bake_renderer("matrix.html", MATRIX)
    story = bake_renderer("storymap.html", STORY)
    bp = bake_renderer("blueprint.html", BLUEPRINT)

    tmp = Path(os.environ.get("TMPDIR") or "/tmp")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out = tmp / f"vibe-check-prd-launch-watcher-{stamp}.html"

    session = {
        "offering": "Competitive Launch Watcher",
        "three_lines": {
            "accomplish": "Catch competitor product launches without living on X",
            "workaround": "Scroll competitor accounts or miss them; v1 uses seed posts",
            "why_sucks": "Noisy, easy to skip, should not require an X API bearer",
        },
        "differentiator": "Any industry + discover unknown companies, cap 10, Slack launch pings",
        "v1": [
            "Continue with X",
            "Industry type + chips",
            "Top 5 checked, search, find unknown, cap 10",
            "Personal alert feed",
            "Grok x_search ingest",
            "Add to Slack, launch only, quiet hours",
        ],
        "v2": ["Pay for more than 10", "WhatsApp/webhook", "LLM classifier"],
        "riskiest": "Grok X Search returns real posts and handles",
        "plan_path": str(PLAN),
    }

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Launch Watcher, Product Requirements</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
  :root{{
    --bg:#F9F9F8; --ink:#1A1A1B; --ink2:#4b5563; --muted:#6B7280; --bd:#E5E5E5;
    --blue:#2C64E3; --blue-soft:#EEF4FF;
    --sans:"DM Sans",ui-sans-serif,system-ui,sans-serif; --serif:"DM Serif Display",Georgia,serif;
  }}
  *{{box-sizing:border-box;margin:0;padding:0;}}
  body{{font-family:var(--sans);color:var(--ink);background:var(--bg);}}
  a{{color:var(--blue);}}
  .wrap{{max-width:1180px;margin:0 auto;padding:0 28px;}}
  header.top{{background:#fff;border-bottom:1px solid var(--bd);}}
  .top .wrap{{padding-top:26px;padding-bottom:20px;}}
  .crumb{{font-weight:700;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);}}
  h1.title{{font-family:var(--serif);font-size:40px;line-height:1.05;margin-top:6px;}}
  .sub{{font-size:17px;color:var(--muted);margin-top:8px;max-width:760px;}}
  nav.tabs{{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--bd);overflow-x:auto;}}
  nav.tabs .wrap{{display:flex;gap:4px;}}
  .tab{{appearance:none;background:none;border:0;cursor:pointer;font-family:var(--sans);font-size:14.5px;font-weight:600;
    color:var(--muted);padding:15px 14px;border-bottom:3px solid transparent;white-space:nowrap;}}
  .tab.active{{color:var(--ink);border-bottom-color:var(--blue);}}
  .tab .n{{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;
    background:#eef0f3;font-size:11px;font-weight:700;margin-right:7px;}}
  .tab.active .n{{background:var(--blue);color:#fff;}}
  main{{padding:34px 0 60px;}}
  .panel{{display:none;}}
  .panel.active{{display:block;}}
  .panel h2{{font-family:var(--serif);font-size:30px;margin-bottom:6px;}}
  .lead{{font-size:17px;color:var(--ink2);margin-bottom:22px;max-width:820px;line-height:1.5;}}
  h3{{font-size:19px;font-weight:700;margin:26px 0 10px;}}
  .card{{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:22px 24px;margin:16px 0;}}
  .grid3{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}}
  .stat{{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:18px 20px;}}
  .stat .k{{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}}
  .stat .v{{font-family:var(--serif);font-size:28px;margin-top:4px;}}
  .three{{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--bd);border-radius:12px;overflow:hidden;background:#fff;}}
  .three > div{{padding:18px 20px;border-right:1px solid var(--bd);}}
  .three > div:last-child{{border-right:0;}}
  .three .k{{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue);margin-bottom:6px;}}
  .pill{{display:inline-block;background:#eef0f3;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;margin:0 6px 6px 0;}}
  .pill.win{{background:#DCFCE7;color:#166534;}}
  ul.clean{{list-style:none;margin:8px 0;}}
  ul.clean li{{padding:7px 0 7px 26px;position:relative;font-size:15px;color:var(--ink2);border-bottom:1px solid #f0f0ee;}}
  ul.clean li:before{{content:"";position:absolute;left:4px;top:14px;width:8px;height:8px;border-radius:50%;background:var(--blue);}}
  .board{{position:relative;width:1080px;max-width:100%;overflow:hidden;border:1px solid var(--bd);border-radius:12px;background:#fff;margin:14px 0 6px;}}
  .board iframe{{border:0;width:1920px;transform-origin:top left;transform:scale(0.5625);display:block;}}
  .board-cap{{font-size:13px;color:var(--muted);margin:0 0 20px 2px;}}
  pre.plan{{background:#111113;color:#fafafa;padding:18px;border-radius:12px;overflow:auto;max-height:70vh;font-size:12px;line-height:1.45;white-space:pre-wrap;}}
  .copy{{margin:8px 0 16px;padding:8px 14px;background:var(--blue);color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer;}}
  footer.attrib{{border-top:1px solid var(--bd);background:#fff;}}
  footer.attrib .wrap{{padding:22px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;}}
  footer.attrib .made{{font-size:14px;color:var(--muted);}}
  footer.attrib .made a{{font-weight:700;text-decoration:none;}}
  @media (max-width:900px){{ .grid3,.three{{grid-template-columns:1fr;}} }}
</style>
</head>
<body>
  <header class="top"><div class="wrap">
    <div class="crumb">Product Requirements · built from a vibe-check session</div>
    <h1 class="title">Competitive Launch Watcher</h1>
    <div class="sub">From a working v1 demo to a daily-use product: log in with X, pick any industry, watch up to 10 accounts (Top 5 already checked), ingest via Grok, ping Slack on launches.</div>
  </div></header>
  <nav class="tabs"><div class="wrap" id="tabbar">
    <button class="tab active" data-tab="start"><span class="n">1</span>Start Here</button>
    <button class="tab" data-tab="evidence"><span class="n">2</span>The Evidence</button>
    <button class="tab" data-tab="experience"><span class="n">3</span>The Experience</button>
    <button class="tab" data-tab="plan"><span class="n">4</span>The Build Plan</button>
    <button class="tab" data-tab="guidelines"><span class="n">5</span>Coding Guidelines</button>
    <button class="tab" data-tab="growth"><span class="n">6</span>Distribution &amp; Growth</button>
    <button class="tab" data-tab="launch"><span class="n">7</span>Before Launch</button>
    <button class="tab" data-tab="handoff"><span class="n">8</span>Hand to Your AI</button>
    <button class="tab" data-tab="continue"><span class="n">9</span>Continue</button>
  </div></nav>
  <main><div class="wrap">

  <section class="panel active" id="start">
    <h2>Start here</h2>
    <p class="lead">You’re the product manager. The coding AI is the engineer. This file is the binder for the session we just had.</p>
    <div class="grid3">
      <div class="stat"><div class="k">Complexity</div><div class="v">7 / 10</div><div class="d">Doable. Don’t add Stripe in the same slice.</div></div>
      <div class="stat"><div class="k">V1 timeline</div><div class="v">2–3 weeks</div><div class="d">With AI, after the Grok test passes.</div></div>
      <div class="stat"><div class="k">Watch cap</div><div class="v">10</div><div class="d">Pay for more is later. Slack only.</div></div>
    </div>
    <h3>The three lines</h3>
    <div class="three">
      <div><div class="k">Accomplish</div><p>Catch competitor launches without living on X.</p></div>
      <div><div class="k">Today</div><p>Scroll accounts or miss them. v1 uses fake seed posts.</p></div>
      <div><div class="k">Why it sucks</div><p>Noisy, easy to skip, and you shouldn’t need an X API token.</p></div>
    </div>
    <h3>Words you now know</h3>
    <p><span class="pill">OAuth / Continue with X</span><span class="pill">Grok X Search</span><span class="pill">Watch</span><span class="pill">Alert</span><span class="pill">Classifier</span><span class="pill">Cron</span><span class="pill">Add to Slack</span><span class="pill">Quiet hours</span><span class="pill">Cap</span><span class="pill">Bearer token</span></p>
  </section>

  <section class="panel" id="evidence">
    <h2>The evidence</h2>
    <p class="lead">Plan-only session on top of a built v1. We did not mine Reddit. Needs are hunches except where this chat proved them (you have no X bearer; v1 already has a scored feed).</p>
    {board_iframe(opp, 608)}
    <p class="board-cap">Opportunity map. Differentiator sits on “discover unknown companies” plus catching launches without living on X.</p>
    {board_iframe(matrix, 608)}
    <p class="board-cap">Workarounds: scrolling X, Google Alerts, enterprise social listening, and our own v1 demo.</p>
    <div class="card"><strong>If Grok search fails Phase 0, stop.</strong> Do not build login on sand.</div>
  </section>

  <section class="panel" id="experience">
    <h2>The experience</h2>
    <p class="lead">We diverged on how “pick an industry” could feel, then fused type-in + chips + a pre-checked Top 5.</p>
    {board_iframe(CRAZY8, 608)}
    <p class="board-cap">Crazy 8 (four directions). Chat-with-Grok was dropped.</p>
    {board_iframe(COMBINE, 608)}
    <p class="board-cap">The combine — this is the aha: names they didn’t know, already checked.</p>
    {board_iframe(bp, 742)}
    <p class="board-cap">Experience blueprint for the first session. Black steps are backstage.</p>
  </section>

  <section class="panel" id="plan">
    <h2>The build plan</h2>
    <p class="lead">Green band only. Do not implement V2 in the same breath.</p>
    {board_iframe(story, 608)}
    <p class="board-cap">Story map. Ship the green row.</p>
    <h3>V1</h3>
    <ul class="clean">
      <li>Continue with X</li>
      <li>Any industry · Top 5 checked · search · find unknown · cap 10</li>
      <li>Personal feed · Grok ingest · Slack launch pings · quiet hours</li>
    </ul>
    <h3>V2+</h3>
    <ul class="clean">
      <li>Pay for more than 10</li>
      <li>WhatsApp / webhooks</li>
      <li>LLM classifier, LinkedIn, public digests</li>
    </ul>
    <p>Phases 0–6 with STOP checkpoints live in the markdown plan. Start at Phase 0 (Grok test).</p>
  </section>

  <section class="panel" id="guidelines">
    <h2>Coding guidelines</h2>
    <p class="lead">Paste-ready house rules also live in CLAUDE.md. Keep that file under 100 lines.</p>
    <div class="card">
      <p>Don’t repeat yourself. Same names: watch, competitor, alert, launch. Slack only. No Stripe. No WhatsApp. Classifier stays heuristic unless asked.</p>
    </div>
  </section>

  <section class="panel" id="growth">
    <h2>Distribution &amp; growth</h2>
    <p class="lead">No honest viral loop in V1. Using the app does not create the next user. That’s OK.</p>
    <div class="card">
      <p><strong>First 10:</strong> you + operators who already track a niche (Voice AI is the demo chip).</p>
      <p><strong>Channel:</strong> X / category Discords where people say they missed a launch.</p>
      <p><strong>First move:</strong> after Slack works for you, post a useful teardown — not spam.</p>
      <p><strong>Loop:</strong> none yet. Later maybe public digests. Don’t fake an invite wall.</p>
    </div>
  </section>

  <section class="panel" id="launch">
    <h2>Before launch</h2>
    <ul class="clean">
      <li>Handle now: env secrets, Slack tokens encrypted, keyboard/labels</li>
      <li>Before other people: privacy policy + terms</li>
      <li>At launch: error tracking</li>
      <li>Run the three audit prompts in the markdown plan</li>
    </ul>
  </section>

  <section class="panel" id="handoff">
    <h2>Hand to your AI</h2>
    <p class="lead">This is the instruction manual. Also saved at docs/VIBE-CHECK-PLAN.md in the repo.</p>
    <button class="copy" type="button" id="copyplan">Copy plan</button>
    <pre class="plan" id="plantext">{esc(plan)}</pre>
  </section>

  <section class="panel" id="continue">
    <h2>Continue later</h2>
    <p class="lead">Open a new vibe-check chat, attach this HTML file, and say “continue from this PRD.”</p>
    <p>Start building at <strong>Phase 0</strong> only. Wait at every checkpoint.</p>
  </section>

  </div></main>
  <footer class="attrib"><div class="wrap">
    <div class="made"><a href="https://github.com/TexasBedouin/vibe-check" target="_blank" rel="noopener">This PRD was created by the vibe-check skill, by Amer Arab</a></div>
    <div class="v">vibe-check v2.6.1</div>
  </div></footer>
  <script type="application/json" id="vibe-check-session">{json.dumps(session)}</script>
  <script>
    document.getElementById('tabbar').addEventListener('click', (e) => {{
      const b = e.target.closest('.tab'); if (!b) return;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').addEventListener;
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      b.classList.add('active');
      document.getElementById(b.dataset.tab).classList.add('active');
    }});
    document.getElementById('copyplan').addEventListener('click', async () => {{
      await navigator.clipboard.writeText(document.getElementById('plantext').innerText);
      document.getElementById('copyplan').textContent = 'Copied';
    }});
  </script>
</body>
</html>
"""
    # fix accidental junk line
    html = html.replace(
        "document.querySelectorAll('.panel').addEventListener;",
        "",
    )
    out.write_text(html)
    print(out)
    subprocess.run(["open", str(out)], check=False)


if __name__ == "__main__":
    main()
