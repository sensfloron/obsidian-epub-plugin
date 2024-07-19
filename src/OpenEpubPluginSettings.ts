import { App, PluginSettingTab, Setting } from 'obsidian';
import OpenEpubPlugin  from './main';

export interface OpenEpubPluginSettings {
	scrolledView: boolean;
	notePath: string;
	useSameFolder: boolean;
	tags: string;
}


export const DEFAULT_SETTINGS: OpenEpubPluginSettings = {
	scrolledView: false,
	notePath: '/',
	useSameFolder: true,
	tags: 'notes/booknotes'
}

// 插件设置面板
export class OpenEpubSettingTab extends PluginSettingTab {
	plugin: OpenEpubPlugin;

	constructor(app: App, plugin: OpenEpubPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		/*
		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
		*/
	}
}
