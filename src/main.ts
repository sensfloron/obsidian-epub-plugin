import { Plugin, WorkspaceLeaf } from 'obsidian';

import { EpubView, EPUB_FILE_EXTENSION, VIEW_TYPE_EPUB } from './EpubView';
// Remember to rename these classes and interfaces!
import { OpenEpubPluginSettings, DEFAULT_SETTINGS, OpenEpubSettingTab } from './OpenEpubPluginSettings'



export default class OpenEpubPlugin extends Plugin {
	settings: OpenEpubPluginSettings;
	currentLocationMap: Map<string, string>
	// TODO: 暂时写死，后期改为配置面板配置，并且路径默认为.config目录的epubReadLocation.json
	// private path_currentLocation = "currentLocation.json"
	async onload() {
		await this.loadSettings();
		// 读取当前位置Map对象
		// this.app.vault.adapter.read(this.path_currentLocation).then((content) => {
		// 	try {
		// 		this.currentLocationMap = JSON.parse(content);
		// 	}catch{
		// 		this.currentLocationMap = new Map<string, string>();
		// 	} 
		// });
		this.registerView(VIEW_TYPE_EPUB, (leaf: WorkspaceLeaf) => {
			return new EpubView(leaf, this.settings);
		});

		this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
			if (leaf && leaf.view instanceof EpubView) {
				//TODO: 打开当前epub页面，获取主题颜色，如果页面颜色和主题颜色不一致就重新渲染，如果打开的页面为空则重新渲染
				leaf.view.getThemeFontColor();
			}
		}));


		// 监听主题变化
		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				// TODO: 获取主题颜色，如果主题颜色和页面颜色不一致就重新渲染
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
