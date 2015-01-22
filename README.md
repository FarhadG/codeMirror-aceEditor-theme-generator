CodeMirror & AceEditor Theme Generator
====

Generate Code Mirror and Ace Editor themes with the help of a sleek GUI and/or from the thousands of available themes for Sublime Text and Text Mate.

This project is in its early stages and will continue to grow with new features.

Some of the parsing from SublimeText and TextMate's XML to CodeMirror and AceEditor's CSS are not one-to-one, as they each have different levels and specificity for their selectors. That said, this tool should provide you a nice basis to help make CodeMirror and AceEditor themes.

If something is not working or you would like a new feature, please use the issues page.


## Installation

You can simply fork and clone (or download) the repo into your local directory:

```
  $ git clone https://github.com/FarhadG/codeMirror-aceEditor-theme-generator
  $ cd codeMirror-aceEditor-theme-generator
  $ npm install
```


## Usage

After installing the package, you can run the `main.js` script to convert SublimeText's & TextMate's XML to CodeMirror's CSS. The script takes 2 arguments (3rd is optional).

1.  Theme name: Should be the same one provided to CodeMirror's theme API option, so that the correct namespacing applies over the CSS classes.
2.  The source file path: The relative path to the source file.
3.  The destination file path: The relative path for the output directory/file.
4.  You can pass a boolean (true/false) for having the CSS JSON printed out to the console. This can be useful is you find variables from Sublime or TextMate's XML that match up with CodeMirror and AceEditor's classes. If so, you can update the scopes files and/or open a GitHub issue.

```
  $ node main.js [themeName] [pathToSrcFile] [pathToDestinationFile(optional)] [debugMode(optional)]
```


## GUI Interface

Here's the <a href="http://tmtheme-editor.herokuapp.com/" target="_blank">LINK</a> for making SublimeText and TextMate with a visual interface. After saving the file, you can, then, take the file and run the generator script for converting the XML to CSS.


## Options

I'll be adding more features; that said, if you'd like a feature, let me know so that I'll try and implement it into future updates.
