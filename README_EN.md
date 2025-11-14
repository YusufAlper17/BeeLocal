# 🐝 BeeLocal - Ninova File Synchronization App

Modern desktop application for İTÜ Ninova platform. Easily track, manage, and download your course files.

<div align="center">
  <img src="assets/icon.png" alt="BeeLocal Logo" width="120" height="120">
  
  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
  [![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)]()
  [![Website](https://img.shields.io/badge/website-GitHub%20Pages-blue)](https://yusufalperilhan.github.io/BeeLocal)
  
  [🇹🇷 Türkçe](README.md) • [🇬🇧 English](README_EN.md)
</div>

## 📖 What is Ninova?

**Ninova** is an e-learning platform developed by Istanbul Technical University (İTÜ). It provides an electronic environment for teaching and learning for students and instructors. Through the platform, you can access:

- 📚 Course materials (lecture notes, presentations, PDFs)
- 📎 Course files and attachments
- 📢 Announcements and news
- 📝 Assignments and projects
- 📊 Course content and resources

**BeeLocal** automatically tracks your course files on the Ninova platform, notifies you of new files, and makes it easy to download them. No need to manually check each file anymore!

## ✨ Features

### 🔐 Security
- **Encrypted Storage**: Your login credentials are securely encrypted using Electron's safeStorage API
- **Remember Me**: Login once, never enter your password again
- **Local Data**: All your data is stored locally on your device, no data is sent externally

### 📚 Course Management
- View all your courses in one place
- Organized list for easy access to courses
- Semester and course code information
- Quick search and filtering

### 📥 Smart File Tracking
- See which files are downloaded/not downloaded
- Downloaded files are marked in green, new files in blue
- View file size and upload date
- Reliable record keeping with SQLite database

### ⚡ Flexible Download Options
- **Single File**: Quickly download a single file
- **Multiple Selection**: Select desired files and download in bulk
- **Download All**: Download all new files with one click
- **Progress Tracking**: Track download progress in real-time

### 🎨 Modern Interface
- Intuitive and user-friendly design
- Responsive layout (adapts to all screen sizes)
- Material Design principles
- Smooth animations and transitions

### 🌙 Theme Support
- **Light Mode**: Bright theme for daytime use
- **Dark Mode**: Eye-friendly dark theme
- **System Theme**: Automatically follow your operating system's theme

### ⚙️ Customizable Settings
- **Folder Structure Selection**:
  - Course Name: `Downloads/[Course Name]/[File]`
  - Semester/Course: `Downloads/[Semester]/[Course]/[File]`
  - Custom: Define your own structure
- **Notifications**: Get notified when downloads complete
- **Download Folder**: Choose your preferred folder

## 📋 Installation

### System Requirements

- **macOS**: 10.13 (High Sierra) or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04 or equivalent
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk**: At least 500MB free space

### Quick Start

#### Pre-built Installers (Recommended)

1. Download the appropriate file for your platform from the [Releases](https://github.com/yusufalperilhan/BeeLocal/releases) page:
   - **macOS**: `BeeLocal-1.0.0-arm64.dmg`
   - **Windows**: `BeeLocal-Setup-1.0.0-win-x64.exe`
   - **Linux**: `BeeLocal-1.0.0-linux-x64.AppImage`

2. Run the downloaded file and follow the installation steps

#### Build from Source

```bash
# Clone the repository
git clone https://github.com/yusufalperilhan/BeeLocal.git
cd BeeLocal

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Create production build
npm run electron:build
```

For detailed installation instructions, see [KURULUM.md](KURULUM.md).

## 🚀 Usage

### 1. First Login

- Open the application
- Enter your İTÜ username and password
- Check "Remember Me" to enable automatic login
- Click "Login"

### 2. Main Screen (Dashboard)

![Dashboard](docs/screenshots/dashboard.png)

On the main screen:
- **Left Panel**: List of your courses and "All Announcements" button
- **Right Panel**: Details of the selected course (Class Files, Course Files, Announcements)
- **Top Bar**: Refresh, Settings, and Logout buttons

### 3. File Management

![File Management](docs/screenshots/files.png)

On the file management screen:
- View folders and files of the selected course
- See undownloaded files (missing file count is displayed)
- Select all files with "Select All"
- Download missing files in bulk with "Download Missing Files" button
- Click on folders to view their contents

## 🛠️ Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Desktop Framework | Electron | 28.0.0 |
| UI Framework | React | 18.2.0 |
| Type Safety | TypeScript | 5.2.2 |
| Styling | Tailwind CSS | 3.3.6 |
| State Management | Zustand | 4.4.7 |
| Web Scraping | Puppeteer | 23.11.1 |
| Database | SQL.js | 1.10.3 |
| Build Tool | Vite | 5.0.8 |

## 📁 Project Structure

```
BeeLocal/
├── electron/              # Electron main process
│   ├── main.ts           # Application entry point
│   ├── preload.ts        # IPC bridge
│   └── services/         # Backend services
│       ├── ninova.ts     # Ninova scraper
│       ├── database.ts   # SQLite management
│       ├── storage.ts    # Secure storage
│       └── download.ts   # File download
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── pages/           # Page components
│   ├── store/           # Zustand state stores
│   ├── types/           # TypeScript types
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helper functions
├── assets/              # Icons and images
└── public/              # Static files
```

## 🌐 Website (GitHub Pages)

BeeLocal's official website is published via GitHub Pages: [yusufalperilhan.github.io/BeeLocal](https://yusufalperilhan.github.io/BeeLocal)

The website includes application features, screenshots, and download links.

## 🤝 Contributing

Contributions are welcome! To contribute to the project:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Bug Reports

If you find a bug or have a suggestion, please open a new issue on the [Issues](https://github.com/yusufalperilhan/BeeLocal/issues) page.

## 📝 Changelog

All notable changes are documented in [CHANGELOG.md](CHANGELOG.md).

## 🔒 Privacy

BeeLocal values your privacy:

- ✅ All data is stored locally
- ✅ Passwords are securely encrypted
- ✅ No data is sent to third-party servers
- ✅ Open source - you can see what we do

## ⚠️ Legal Notice

This application is **not an official İTÜ application**. It is developed by students, for students, to make life easier. By using this application, you agree to comply with İTÜ's terms of use.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- İTÜ students for inspiration and feedback
- Open source community for great tools
- Everyone who contributed

---

<div align="center">
  
  
  [Website](https://yusufalperilhan.github.io/BeeLocal) • [Documentation](docs/) • [Report Bug](https://github.com/yusufalperilhan/BeeLocal/issues) • [Request Feature](https://github.com/yusufalperilhan/BeeLocal/issues)
</div>

