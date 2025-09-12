from colorama import Fore, Style, Back

def colorize_status(status):
    """
    Colorize PASS/FAIL/ERROR/ABSENT and arbitrary custom statuses.
    """
    if len(status.split()) == 1:
        pre_status = status
        post_status = ""
    else:
        pre_status, post_status = status.split()

    if pre_status == "PASS":
        return Fore.GREEN + pre_status + Fore.BLUE + " " + post_status + Style.RESET_ALL
    elif pre_status == "FAIL":
        return Fore.RED + pre_status + Fore.BLUE + " " + post_status + Style.RESET_ALL
    elif pre_status == "ERROR":
        return Fore.MAGENTA + pre_status + Fore.BLUE + " " + post_status + Style.RESET_ALL
    elif pre_status == "ABSENT":
        return Fore.YELLOW + pre_status + Fore.BLUE + " " + post_status + Style.RESET_ALL
    else:
        return Fore.BLUE + status + Style.RESET_ALL

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

def get_status(test_name, log_results):
    """
    Determine if test_name is PASS, FAIL, ERROR, ABSENT or custom.
    """
    return log_results.get(test_name, "ABSENT")

def colorize_boolean(text):
    """
    Colorize Yes/No values with green background for Yes and default for No.
    """
    if text == "Yes":
        return Back.GREEN + Fore.BLACK + text + Style.RESET_ALL
    else:
        return text