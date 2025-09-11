# New util functions can be added here as needed.

from colorama import Fore, Style

def colorize_status(status):
    """
    Colorize PASS/FAIL/ERROR/ABSENT and arbitrary custom statuses.
    """
    if status == "PASS":
        return Fore.GREEN + status + Style.RESET_ALL
    elif status == "FAIL":
        return Fore.RED + status + Style.RESET_ALL
    elif status == "ERROR":
        return Fore.MAGENTA + status + Style.RESET_ALL
    elif status == "ABSENT":
        return Fore.YELLOW + status + Style.RESET_ALL
    else:
        # Any custom result (e.g., "req", "timeout", etc.)
        return Fore.BLUE + status + Style.RESET_ALL

def get_status(test_name, log_results):
    """
    Determine if test_name is PASS, FAIL, ERROR, ABSENT or custom.
    """
    return log_results.get(test_name, "ABSENT")

def colorize_text(text, color_name):
    """
    Colorize arbitrary text with the given color name.
    Supported: "green", "red", "blue", "yellow", "cyan", "magenta", "white".
    """
    colors = {
        "green": Fore.GREEN,
        "red": Fore.RED,
        "blue": Fore.BLUE,
        "yellow": Fore.YELLOW,
        "cyan": Fore.CYAN,
        "magenta": Fore.MAGENTA,
        "white": Fore.WHITE,
    }
    color = colors.get(color_name.lower(), Fore.WHITE)
    return color + text + Style.RESET_ALL
