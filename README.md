# Advanced Profanity Filter Web
This is a project that helps remove profanity from files. It uses the same filter engine and configuration as the browser extension: [Advanced Profanity Filter](https://github.com/richardfrost/AdvancedProfanityFilter#advanced-profanity-filter).

### Supported File Types
- `.ePUB` (Ebook)
- `.srt` (Subtitles)
- `.txt` (Plain text)
- `.md` (Markdown)

### Supported Without Formatting (Via [textract](https://www.npmjs.com/package/textract))
- HTML, HTM
- ATOM, RSS
- XML, XSL
- PDF
- DOC, DOCX
- ODT, OTT (experimental, feedback needed!)
- RTF
- XLS, XLSX, XLSB, XLSM, XLTX
- CSV
- ODS, OTS
- PPTX, POTX
- ODP, OTP
- ODG, OTG
- PNG, JPG, GIF
- DXF
- application/javascript
- All text/* mime-types

# Developing or Running Locally
1. Install [Node.js](https://nodejs.org/en/download/)
2. [Download a zip](https://github.com/richardfrost/AdvancedProfanityFilterWeb/archive/master.zip) or clone the repo (requires git)
3. With a terminal/command prompt run `npm install` from within the downloaded repo directory
4. From a terminal in the project directory, run `npm start` and then navigate to [http://localhost:4000](http://localhost:4000) in your browser

_Starting the project after going through the steps above: Repeat step 4._

_Updating: Repeat steps 2 and 3 listed above._
