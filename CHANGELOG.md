# Changelog

## 2.2.2

*   Add an activation hook to delay package loading till Atom is ready ([#80][])
*   Fix messages not being updated properly ([#82][])
*   Add `minimap-plus` to the options for `minimap` providers ([#86][])
*   Many dependency updates

[#80]: https://github.com/AtomLinter/atom-minimap-linter/pull/80
[#82]: https://github.com/AtomLinter/atom-minimap-linter/pull/82
[#86]: https://github.com/AtomLinter/atom-minimap-linter/pull/86

## 2.2.1

*   Fixed TypeError when changing settings ([#47][])

[#47]: https://github.com/AtomLinter/atom-minimap-linter/pull/47

## 2.2.0

*   Allow severity-based marker setting ([#38][])

[#38]: https://github.com/AtomLinter/atom-minimap-linter/pull/38

## 2.1.3

*   Clarify the README a bit

## 2.1.2

*   Update message format for `atom-ide-ui@0.5.2` ([#30][])

[#30]: https://github.com/AtomLinter/atom-minimap-linter/pull/30

## 2.1.1

*   Better validation of messages ([#26][])

[#26]: https://github.com/AtomLinter/atom-minimap-linter/pull/26

## 2.1.0

*   Add support for `diagnostics-store` messages (`atom-ide-ui`) ([#23][])
*   Fix a bug where messages could get "stuck" ([#24][])

[#23]: https://github.com/AtomLinter/atom-minimap-linter/pull/23
[#24]: https://github.com/AtomLinter/atom-minimap-linter/pull/24

## 2.0.2

*   Guard against minimap losing its association with a `TextEditor`.

## 2.0.1

*   Fixed a bug with multiple Editors open to the same file not showing the
    correct highlighting.

## 2.0.0

*   Rewrite to handle Linter v2, now works as a Linter "UI" instead of hooking
    into the Linter internals, which should make it forwards compatible.
*   Also updates some conventions with regards to the Minimap consumer
*   Add specs and CI to ensure things stay working

## 1.0.0

*   (fix) Plugin activation/deactivation
*   (feat) Support for info markers
*   (feat) Marker style configuration

## 0.1.0 - First Release

*   Every feature added
*   Every bug fixed
*   TODO: tests
