import { flavors, version } from "@catppuccin/palette";
import chalk from "chalk";
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { findYamlFiles, readYamlFile, mergeAttributes } from './yamlUtils.js';
import { jsonObjectToXml } from './xmlUtils.js';
import { getProjectPath, getFragmentsFolder, ensureDist, getAssetsFolder, getPreviewFolder } from './fileUtils.js';
import { getColorBank, replaceColorVariables } from './colorUtils.js';

/**
 * Main function to convert YAML files to XML
 * @param {string} flavorKey - The key for the Catppuccin flavor
 * @param {object} flavor - The Catppuccin flavor object to use for theming
 */
function convertYamlToXml(flavorKey, flavor) {
    try {
        const flavorName = flavor.name;
        console.log(chalk.blue(`Starting YAML to XML conversion for flavor: ${flavorName}`));

        // Path to theme.yaml file (the main file)
        const mainYamlFilePath = path.join(getFragmentsFolder(), 'theme.yaml');

        // Path to fragments directory
        const fragmentsDir = getFragmentsFolder();

        // Path for output XML file - now includes the flavor name
        const outputXmlPath = getProjectPath(`theme_${flavorKey}.xml`);

        console.log(chalk.blue(`Reading main YAML from: ${path.basename(mainYamlFilePath)}`));

        // Read and parse main YAML file (synchronously)
        const mainYamlData = readYamlFile(mainYamlFilePath);

        if (!mainYamlData) {
            throw new Error('Empty or invalid main YAML file');
        }

        // Modify the name attribute to include the flavor
        const rootKey = Object.keys(mainYamlData)[0];
        if (mainYamlData[rootKey] && mainYamlData[rootKey]['@attributes']) {
            mainYamlData[rootKey]['@attributes'].name = `Catppuccin ${flavorName}`;

            // Set the color_set_bank attribute based on the flavor
            mainYamlData[rootKey]['@attributes'].color_set_bank = getColorBank(flavor);
        }

        console.log(chalk.green('Successfully parsed main YAML data'));

        // Find all other YAML fragment files (excluding the main theme.yaml)
        console.log(chalk.blue('Searching for fragment YAML files...'));
        const excludeFiles = [path.basename(mainYamlFilePath)]; // Exclude the main file
        const fragmentFiles = findYamlFiles(fragmentsDir, excludeFiles);

        console.log(chalk.green(`Found ${fragmentFiles.length} fragment YAML files`));

        // Merge all fragment files into the main data structure
        let mergedYamlData = { ...mainYamlData };
        for (const fragmentFile of fragmentFiles) {
            console.log(chalk.blue(`Processing fragment: ${path.relative(fragmentsDir, fragmentFile)}`));

            // Read and parse fragment YAML file (synchronously)
            const fragmentYamlData = readYamlFile(fragmentFile);

            if (!fragmentYamlData) {
                console.warn(chalk.yellow(`Warning: Empty or invalid YAML fragment: ${fragmentFile}`));
                continue;
            }

            // Merge the fragment data into the main data
            // We assume each fragment has the same root key (opus_theme_nc)
            const rootKey = Object.keys(mergedYamlData)[0];
            if (fragmentYamlData[rootKey]) {
                mergedYamlData[rootKey] = mergeAttributes(mergedYamlData[rootKey], fragmentYamlData[rootKey]);
            }
        }

        console.log(chalk.green('All fragments merged successfully'));

        // Generate XML string using our new direct string-based approach
        // This preserves attribute names exactly as they are (even if they start with numbers)
        console.log(chalk.blue('Converting merged YAML data to XML...'));
        let xmlString = jsonObjectToXml(mergedYamlData);

        // Replace CSS variables with their actual color values
        console.log(chalk.blue(`Replacing color variables with actual hex values for flavor: ${flavorName}`));
        xmlString = replaceColorVariables(xmlString, flavor);

        // Write to output file
        fs.writeFileSync(outputXmlPath, xmlString, 'utf-8');

        console.log(chalk.green(`Successfully created XML file at: ${path.basename(outputXmlPath)}`));
    } catch (error) {
        console.error(chalk.red(`Error converting YAML to XML: ${error.message} / ${error.stack}`));
        process.exit(1);
    }
}

/**
 * Creates a zip archive for a flavor containing the theme files
 * @param {string} flavorKey - The key for the Catppuccin flavor
 * @param {Object} flavor - The Catppuccin flavor object
 */
function createThemeArchive(flavorKey, flavor) {
    try {
        const flavorName = flavor.name;
        console.log(chalk.blue(`Creating theme archive for flavor: ${flavorName}`));

        // Ensure the dist directory exists
        const distPath = ensureDist();

        // Define archive path
        const archivePath = path.join(distPath, `Catppuccin ${flavorName}.dlt`);

        // Delete the archive if it already exists
        if (fs.existsSync(archivePath)) {
            fs.unlinkSync(archivePath);
            console.log(chalk.yellow(`Removed existing archive: ${path.basename(archivePath)}`));
        }

        // Create a write stream to the archive file
        const output = fs.createWriteStream(archivePath);

        // Create a new archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression level
        });

        // Pipe the archive to the output file
        archive.pipe(output);

        // Add the XML file as theme.xml
        const xmlSourcePath = getProjectPath(`theme_${flavorKey}.xml`);
        archive.file(xmlSourcePath, { name: 'theme.xml' });

        // Add the Images directory from assets
        const imagesPath = path.join(getAssetsFolder(), 'Images');
        if (fs.existsSync(imagesPath)) {
            archive.directory(imagesPath, 'Images');
        } else {
            console.log(chalk.yellow(`Warning: Images directory not found at ${imagesPath}`));
        }

        // Add the preview file for the specific flavor
        const previewFolder = getPreviewFolder();
        const previewFilePath = path.join(previewFolder, `${flavorKey}.jpg`);
        if (fs.existsSync(previewFilePath)) {
            archive.file(previewFilePath, { name: `preview.jpg` });
        } else {
            console.log(chalk.yellow(`Warning: Preview file not found at ${previewFilePath}`));
        }

        // Finalize the archive and close the write stream when done
        output.on('close', () => {
            const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(chalk.green(`Successfully created archive: ${path.basename(archivePath)} (${sizeInMB} MB)`));
        });

        // Handle any warnings during archiving
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn(chalk.yellow(`Warning during archive creation: ${err.message}`));
            } else {
                throw err;
            }
        });

        // Handle errors during archiving
        archive.on('error', (err) => {
            throw err;
        });

        // Finalize the archive
        archive.finalize();
    } catch (error) {
        console.error(chalk.red(`Error creating theme archive: ${error.message}`));
    }
}

/**
 * Main function that runs all build processes
 */
function build() {
    console.log(chalk.cyan('=== Catppuccin Directory Opus Theme Builder ==='));
    console.log(chalk.cyan(`Using Catppuccin palette v${version}`));

    Object.entries(flavors).forEach(([flavorKey, flavor]) => {
        console.log(chalk.cyan(`Building theme for ${flavor.name}`));
        convertYamlToXml(flavorKey, flavor);
        createThemeArchive(flavorKey, flavor);
    });
}

build();
