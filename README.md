# ⚡ ZeroPoint // Start Page

A minimalist, high-performance browser start page and productivity dashboard.
Built with a focus on aesthetics, minimalism, and the idea of a functional system terminal.

![License](https://img.shields.io/badge/license-MIT-blueviolet)
![Version](https://img.shields.io/badge/version-1.0.4a-neon)

---

## 🎨 Features

* **Command Palette:** Instant control via the search bar. Use `/bg`, `/theme`, or `/timer` to manipulate the UI without menus.
* **Integrated System Terminal:** A fully functional debug console accessible via the backtick ``` ` ``` key to monitor network calls and system status.
* **Productivity Suite:**
    * **Focus Timer:** Pomodoro-style countdown integrated into the main clock.
    * **Smart Tasks:** Nested sub-task support with local persistence.
    * **Weather:** Smart-cached (60m) weather reporting via Open-Meteo. (No API key required)
* **Theme Engine:** 7+ built-in color profiles that update the entire UI, including glows and glassmorphism effects.
* **Dynamic Background Engine:** 9+ high-performance Canvas effects including `Matrix`, `Crystals`, `Stellar`, and `Sakura Petals`.


## ⌨️ Command Palette Reference

Type these directly into the main search bar:

| Command | Action | Example |
| :--- | :--- | :--- |
| `/bg` | Switch canvas background effect | `/bg crystals` |
| `/theme` | Change the UI color profile | `/theme vaporwave` |
| `/timer` | Set a focus timer in minutes | `/timer 25` |
| `/zen` | Hide all UI elements for pure focus | `/zen` |


## 🚀 Roadmap & Future Updates

ZeroPoint is an evolving project. Planned roadmap and features for upcoming releases include:

- [ ] **Refactoring**
  * Need to refactor everything into easier to navigate pieces/modules.
- [ ] **Bangs Support**
  * Universal navigation via the search bar. Typing `!g` redirects to Google, `!a` to Amazon, or `!w` to Wikipedia, turning the search bar into a high-speed command hub.
- [ ] **Export/Import Configs**
  * Current settings rely on `localStorage`. This feature will allow users to download a `config.json` file containing all shortcuts, tasks, and theme preferences to sync across different browsers or machines. Also toying with the idea of a jsonified string like in [StartTreeV2](https://github.com/AlexW00/StartTreeV2).
- [ ] **Notepad**
  * A dedicated view providing a distraction-free environment for persistent note-taking. Possibly looking into Markdown support at some point.
- [ ] **Mobile Optimization**
  * Transformation into a Progressive Web App (PWA). Includes responsive CSS media queries for vertical screens and optimized touch-event listeners for mobile interaction.
- [ ] **Advanced System Expansion**
  * More Themes! More Backgrounds!! More Terminal!!!


## 🛠️ Installation & Setup

1. **Clone the repository:**
   `git clone [https://github.com/yourusername/zeropoint.git](https://github.com/yourusername/zeropoint.git)`
2. **Open index.html**
   `Simply open the file in any modern evergreen browser (Chrome, Firefox, Edge). No build step required.`


## 📜 License
Distributed under the MIT License. See LICENSE for more information.
