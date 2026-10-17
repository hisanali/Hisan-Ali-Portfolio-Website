# Football interaction research — 17 October 2026

The design uses official EA and Konami material as interaction references. It does not claim access to either game's engine, animation database, proprietary implementation or current online services. The mobile articles below are older official command guides; they establish the interaction patterns, rather than a complete version-specific inventory for the latest releases.

## What the references establish

- [EA: FIFA Mobile button controls](https://www.ea.com/ea-originals/news/gameplay-guide-button-controls): separate ground and through passes, charged actions, directional swipe modifiers, contextual attack/defence commands, player switching and team mentality. These explain how a small touch interface exposes a larger command set. Applied here as five action buttons, pass/shot swipe modifiers, a command guide, directional assistance and in-match mentality.
- [Konami: eFootball mobile command tutorials](https://www.konami.com/efootball/en-us/page/new_controls): touch commands have distinct tactical purposes, including match-up, pass-and-run and pressure. More forceful kicks have a preparation cost. Applied here as explicit jockeying, give-and-go runs, teammate pressure and the existing animation-timed ball contact. Our swipe scheme follows the documented EA button pattern; it is not an exact copy of Konami's separate Touch & Flick scheme.
- [EA: FC 26 gameplay deep dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive): responsive and authentic presets serve different match tempos. Applied here as two tunings of player speed and acceleration while keeping the same physical ball simulation and movement clips. These are our tunings, not extracted FC values.
- [Konami: controller manual](https://www.konami.com/efootball/en/page/mobile_controller): documents controller commands alongside mobile play. Applied here using the browser Standard Gamepad mapping, with Classic and Alternate face-button layouts. Hardware behaviour still depends on browser/OS support.

## Implemented in this browser game

A match hub with Kick off, Game plan, Training and Settings; dark angular panels, lime active states, compact broadcast score display, player stamina strips and central radar. Menus retain the stadium behind them. Touch controls use five contextual buttons and an independent joystick. Keyboard and controller share the same command dispatch.

Game plan supports 4-3-3, 4-4-2 and 4-2-3-1 in 11-a-side, plus fixed small-sided shapes. Mentality shifts support depth and width. Camera, zoom, pass assistance, auto/manual defender switching, touch scale/opacity, hints and rendering quality persist locally. Pause and full-time screens show measured possession, shots, completed passes, passing accuracy and successful tackles.

Training consists of six playable drills, advanced by movement distance, sprint distance, completed ground/through passes, a released shot and sustained jockeying. Retry reconstructs the drill. Training does not consume the match clock.

## Scope that remains different

This is a local exhibition game. It does not implement Ultimate Team/Dream Team economies, online matchmaking, career transfers, licensed leagues, commentary, proprietary motion matching, a complete skill-move catalogue or their production-scale stadium/player libraries. Supporting players use the credited adult model with variations. Rendering and animation quality are bounded by the assets and this browser implementation; feature additions do not establish visual parity with a commercial console game.
