# KBM: Better Keyboard Macros for Linux*
<sup><sup><sup>*and potentially other operating systems.</sup></sup></sup>

Install on any Linux with Xorg.
> `npm i -g kbm` (may require sudo) <br/>
> `kbm config` to setup keyboards <br/>
> `kbm daemon` to run the macros <br/>

All configuration is in `~/.config/kbm`

## The Problem
My current/old setup is stupid.
- [i3wm][i3wm] handling some key binds.
- [sxhkd][sxhkd] handling a lot of the other ones.
- [akm][akm], a tool i made for basic usage external keyboards.

[i3wm]: https://build.i3wm.org/docs/userguide.html#keybindings
[sxhkd]: https://github.com/baskerville/sxhkd
[akm]: https://www.npmjs.com/package/akm

They all have their own file format for setting them, and you cannot
write more than one line, causing [this giant list of programs][dfmacros] that should
go with the macros, not as separate shell scripts in.

[dfmacros]: https://github.com/davecaruso/dotfiles/tree/d10202042242eac3e987bab5442950ca8f28ac0f/bin/macro

## The Solution
Make something to solve all the problems, even if it helps no one else.

This program is capable of listening on as many dedicated keyboards for raw events, and running complex commands. It can also hook into X11 and add global keybindings there.

oh also KBM stands for **K**ey**b**oard **M**acros.

## Basic Feature List
- Same format for external and x11 keybinds
- Any key can be a modifier (external only)
- Key name aliases
- Functions
- Inline bash/node/python scripts
- A VSCode Extension

## Config Examples
There are no examples besides the ones [I personally use](https://github.com/davecaruso/dotfiles/tree/master/macros).
