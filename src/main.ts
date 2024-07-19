import { Plugin, WorkspaceLeaf } from 'obsidian';

import { EpubView, EPUB_FILE_EXTENSION, VIEW_TYPE_EPUB } from './EpubView';
// Remember to rename these classes and interfaces!
import { OpenEpubPluginSettings, DEFAULT_SETTINGS, OpenEpubSettingTab } from './OpenEpubPluginSettings'



export default class OpenEpubPlugin extends Plugin {
	settings: OpenEpubPluginSettings;
	private epubView: EpubView;

	async onload() {
		await this.loadSettings();

		
		this.registerView(VIEW_TYPE_EPUB, (leaf: WorkspaceLeaf) => {
			this.epubView = new EpubView(leaf, this.settings);
			return this.epubView
		});


		// 监听主题变化
		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				EpubView.updateTextColors();
			})
		);

		try {
			this.registerExtensions([EPUB_FILE_EXTENSION], VIEW_TYPE_EPUB);
		} catch (error) {
			console.log(`Existing file extension ${EPUB_FILE_EXTENSION}`);
		}

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new OpenEpubSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}


	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
