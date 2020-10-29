# Gothic Quotes

This is a small browser-based search engine for all the dialogs used in Gothic 1 and Gothic 2 by Piranha Bytes.
It allows to search for phrases with exact and fuzzy search. Results show the dialog text, the corresponding game it is from and the voice-id. Additionally, it can filter results by voice-Id and play the corresponding sound files after clicking on a search result. A click on a result automatically copies the sound file name or text content into the clipoard for later use.

![Screenshot](https://i.imgur.com/q7dkSth.png)

This tool does not contain any material from the gothic games. To generate the search database, it uses the locally installed games.

Installation and usage requires some basic understanding of command line tools.

## Prerequisites

1. An installed copy of Gothic 1 or 2 (or both) with the corresponding Modkit installed ([Gothic 1 MDK](https://www.worldofgothic.de/dl/download_28.htm) & [Gothic 2 MDK](https://www.worldofgothic.de/dl/download_93.htm)).
The Modkits install the raw dialog files the tool uses to read the necessary data from.
If you want to play dialog sound files directly on click, you need to install them via the Modkit too. For Gothic 1 you might need to use [GothicVDFS](https://www.worldofgothic.de/dl/download_27.htm) to extract the sound files (the Gothic 2 Modkit has an explicit option upon installation to do it for you). The tool will expect the sound files inside a `/sound/speech` subdirectory inside the Gothic directory.
2. [Node.js](https://nodejs.org/en/) as the runtime environment for this tool.


## Usage

After extracting the file contents of the tool, navigate into the extracted directory and open a command line (File -> Open Windows PowerShell)

1. Run `npm install` to automatically download and install the tools dependencies.
2. Run `npm run generate -- --g1="G:/Games/Gothic/" --g2="G:/Games/Gothic II/" --copysound` to excract the diaogs from your local Gothic installations and copy the dialog files to the tools' /dist directory for playing them (copying might take some time). Adjust the paths to your local Gothic installations. If you have only one of the games installed, you can ommit the corresponding `--g1=...` or `--g2=...` parameter. You can also ommit the `--copysound` parameter if you do not want to play the dialogs directly inside the tool. The sound files are copied inside the tool's /dist/speech directory.
3. Run `npm run dev` to build the tool and run it locally. It will start a local server with the tool running inside it.
4. Open http://localhost:1234 in your browser.

