# New util functions can be added here as needed.

from colorama import Fore, Style

def colorize_status(status):
    if status == "PASS":
        return Fore.GREEN + status + Style.RESET_ALL
    elif status == "FAIL":
        return Fore.RED + status + Style.RESET_ALL
    elif status == "ABSENT":
        return Fore.YELLOW + status + Style.RESET_ALL
    return status

def get_status(test_name, log_results):
    """
    Determine if test_name is PASS, FAIL, or ABSENT in given log results.
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
