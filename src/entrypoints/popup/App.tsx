import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Search, Settings, Plus, Check } from "lucide-react";
import "@/entrypoints/global.css";
import { Octokit } from "octokit";

// 在文件顶部声明chrome对象，避免TS报错
declare const chrome: any;

function App() {
	const [formData, setFormData] = useState({
		link: "https://github.com/evanlong-me/sidepanel-extension-template",
		title: "evanlong-me/sidepanel-extension-template",
		description: "",
		tags: "",
	});
	const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
	const [showSaved, setShowSaved] = useState(false);
	const [githubConfig, setGithubConfig] = useState<{ token?: string; owner?: string; repo?: string }>({});

	// === 新增：初始化时获取github配置 ===
	useEffect(() => {
		if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
			chrome.storage.sync.get(["githubToken", "githubOwner", "githubRepo"], (result: any) => {
				setGithubConfig({
					token: result.githubToken,
					owner: result.githubOwner,
					repo: result.githubRepo
				});
			});
		}
	}, []);

	// === 新增：初始化时获取当前tab信息 ===
	useEffect(() => {
		if (typeof chrome !== "undefined" && chrome.tabs) {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs: Array<{ url?: string; title?: string }>) => {
				const tab = tabs[0];
				if (tab) {
					setFormData(prev => ({
						...prev,
						link: typeof tab.url === "string" ? tab.url : prev.link,
						title: typeof tab.title === "string" ? tab.title : prev.title,
					}));
				}
			});
		}
	}, []);

	const handleInputChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		setSaveState('saving');
		console.log("Saving bookmark:", { ...formData });

		// ===== Octokit 示例：创建 issue =====
		const token = githubConfig.token;
		const owner = githubConfig.owner;
		const repo = githubConfig.repo;
		if (!token || !owner || !repo) {
			console.error("GitHub 配置缺失");
			setSaveState('idle');
			return;
		}
		const octokit = new Octokit({ auth: token });

		try {
			const response = await octokit.rest.issues.create({
				owner,
				repo,
				title: formData.title,
				body: formData.link,
			});
			console.log("Issue created:", response.data.html_url);

			// 新增：如果有 description，则创建评论
			if (formData.description && formData.description.trim() !== "") {
				await octokit.rest.issues.createComment({
					owner,
					repo,
					issue_number: response.data.number,
					body: formData.description,
				});
			}

			setSaveState('saved');
			setShowSaved(true);
		} catch (error) {
			console.error("Failed to create issue:", error);
			setSaveState('idle');
		}
	};

	const handleSearch = () => {
		// TODO: Implement search functionality
		console.log("Searching bookmarks");
	};

	const handleSettings = () => {
		if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			// fallback: open options page directly if possible
			window.open("chrome-extension://" + (chrome?.runtime?.id || "") + "/entrypoints/options/index.html", "_blank");
		}
	};

	return (
		<div className="w-96 p-4 light relative">
			{showSaved && (
				<div className="absolute top-2 right-2 flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded shadow z-10 animate-fade-in">
					<Check className="h-4 w-4 text-green-600" />
					<span className="font-medium">Saved</span>
				</div>
			)}
			<div className="space-y-4">
				{/* Link Section */}
				<div className="space-y-2">
					<Label htmlFor="link">Link</Label>
					<Input
						id="link"
						value={formData.link}
						onChange={(e) => handleInputChange("link", e.target.value)}
						placeholder="Enter URL"
					/>
				</div>

				{/* Title Section */}
				<div className="space-y-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						value={formData.title}
						onChange={(e) => handleInputChange("title", e.target.value)}
						placeholder="Enter title"
					/>
				</div>

				{/* Description Section */}
				<div className="space-y-2">
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						value={formData.description}
						onChange={(e) => handleInputChange("description", e.target.value)}
						placeholder="Something useful for your future self"
					/>
				</div>

				{/* 删除 Tags Section */}

				{/* 删除 Preview Section */}

				{/* Action Buttons */}
				<div className="flex gap-2 pt-2">
					<Button onClick={handleSave} className="flex-1" disabled={saveState === 'saving'}>
						{saveState === 'saving' ? (
							<span className="flex items-center"><Save className="h-4 w-4 mr-2 animate-spin" />Saving...</span>
						) : saveState === 'saved' ? (
							<span className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-600" />Saved</span>
						) : (
							<><Save className="h-4 w-4 mr-2" />Save</>
						)}
					</Button>
					<Button onClick={handleSearch} variant="outline" className="flex-1">
						<Search className="h-4 w-4 mr-2" />
						Search
					</Button>
					<Button onClick={handleSettings} variant="outline" size="icon">
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export default App;
