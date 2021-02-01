#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <linux/input.h>
#include <pthread.h>
#include <string.h>
#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <iostream>
#include <vector>

// EXTERNAL
static const char *const EXT_EVENT_LABEL[2] = {
  "up",
  "down"
};
static const char* const EXT_KEY_LABELS[256] = {
  "unknown",
  "escape",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "minus",
  "equals",
  "backspace",
  "tab",
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "bracket_left",
  "bracket_right",
  "enter",
  "control_left",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "semicolon",
  "apostrophe",
  "grave",
  "shift_left",
  "backslash",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
  "comma",
  "period",
  "slash",
  "shift_right",
  "kp_multiply",
  "alt_left",
  "space",
  "caps",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "f10",
  "num_lock",
  "scroll_lock",
  "kp_7",
  "kp_8",
  "kp_9",
  "kp_subtract",
  "kp_4",
  "kp_5",
  "kp_6",
  "kp_add",
  "kp_1",
  "kp_2",
  "kp_3",
  "kp_0",
  "kp_period",
  "unknown",
  "unknown",
  "unknown",
  "f11",
  "f12",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "kp_enter",
  "control_right",
  "kp_divide",
  "sysrq",
  "alt_right",
  "unknown",
  "home",
  "up",
  "pageup",
  "left",
  "right",
  "end",
  "down",
  "pagedown",
  "insert",
  "delete",
  "unknown",
  "mute",
  "volumedown",
  "volumeup",
  "unknown",
  "unknown",
  "unknown",
  "pause",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "meta_left",
  "meta_right",
  "compose",
  "stop",
  "redo",
  "unknown",
  "undo",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "find",
  "unknown",
  "help",
  "unknown",
  "unknown",
  "unknown",
  "sleep",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "f13",
  "f14",
  "f15",
  "f16",
  "f17",
  "f18",
  "f19",
  "f20",
  "f21",
  "f22",
  "f23",
  "f24",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown",
  "unknown"
};

int listenExternal(const char* dev) {
  struct input_event ev;
  ssize_t n;
  int fd;

  fd = open(dev, O_RDONLY);
  if (fd == -1) {
    printf("Err: Cannot open %s: %s.\n", dev, strerror(errno));
    return EXIT_FAILURE;
  }

  ioctl(fd, EVIOCGRAB, 1);

  while (1) {
    n = read(fd, &ev, sizeof ev);
    if (n == (ssize_t)-1) {
      if (errno == EINTR)
        continue;
      else
        break;
    } else
    if (n != sizeof ev) {
      errno = EIO;
      break;
    }

    if (ev.type == EV_KEY && ev.value >= 0 && ev.value < 2) {
      fprintf(stderr, "%s,%d,%s\n", EXT_EVENT_LABEL[ev.value], (int)ev.code, EXT_KEY_LABELS[ev.code]);
    }
  }

  printf("Err: %s.\n", strerror(errno));
  ioctl(fd, EVIOCGRAB, 0);

  return EXIT_FAILURE;
}

// X11
struct X11KeyBindEntry {
  int key;
  int state;
};

std::vector<X11KeyBindEntry> entries;
int NumLockMask = 0x10;

int listenX11(const char* file) {

  std::string line;
  while(std::getline(std::cin, line)) {
    int key;
    int state;
    sscanf(line.c_str(), "%d %d", &key, &state);

    X11KeyBindEntry entry;
    entry.key = key;
    entry.state = state;
    entries.push_back(entry);
  }

  Display* dpy = XOpenDisplay(0);
  Window root = DefaultRootWindow(dpy);
  XEvent ev;

  int i = 1;
  for(std::vector<X11KeyBindEntry>::iterator it = entries.begin(); it != entries.end(); ++it) {
    int key = XKeysymToKeycode(dpy, it->key);

    XGrabKey(
      dpy,
      key,
      it->state,
      root,
      False,
      GrabModeAsync,
      GrabModeAsync
    );
    
    XGrabKey(
      dpy,
      key,
      it->state | NumLockMask,
      root,
      False,
      GrabModeAsync,
      GrabModeAsync
    );
  }

  XSelectInput(dpy, root, KeyPressMask );
  while(true) {
    XNextEvent(dpy, &ev);
    if (ev.type == KeyPress) {
      fprintf(stderr, "%d %d\n", (int)XKeycodeToKeysym(dpy, ev.xkey.keycode, 0), ev.xkey.state);
    }
  }
  return 0;
}

// HELP MENU AND CLI
void help(const char* name) {
  printf("Helper for kbm to interface with the system.\n\n");
  printf("Usage:\n");
  printf("  %s external [device]\n", name);
  printf("    (emits key events)\n");
  printf("  %s x11\n", name);
  printf("    (emits combo events, pipe in the combos to listen)\n");
}

int main(int argc, char *argv[]) {
  if (argc == 1) {
    help(argv[0]);
    return 1;
  }

  if (strcmp(argv[1], "external") == 0 && argc == 3) {
    return listenExternal(argv[2]);
  } else if (strcmp(argv[1], "x11") == 0 && argc == 2) {
    return listenX11(argv[2]);
  } else {
    help(argv[0]);
    return 1;
  }
}
