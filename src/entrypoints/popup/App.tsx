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
			console.error("GitHub configuration missing");
			alert("GitHub configuration incomplete!\n\nPlease configure your GitHub token, owner, and repository in Settings before saving bookmarks.");
			setSaveState('idle');
			return;
		}
		const octokit = new Octokit({ auth: token });

		try {
			// First verify repository access
			try {
				await octokit.rest.repos.get({ owner, repo });
			} catch (repoError: any) {
				if (repoError.status === 404) {
					console.error(`Repository not found: ${owner}/${repo}. Check if the repository exists and you have access to it.`);
					alert(`Repository not found: ${owner}/${repo}\n\nPossible causes:\n• Repository doesn't exist\n• Repository is private and you don't have access\n• Owner/repo name is incorrect\n\nPlease check your GitHub configuration in Settings.`);
				} else {
					console.error("Failed to access repository:", repoError);
					alert(`Failed to access repository: ${repoError.message}`);
				}
				setSaveState('idle');
				return;
			}

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
		} catch (error: any) {
			console.error("Failed to create issue:", error);
			
			if (error.status === 404) {
				alert(`GitHub API Error: Not Found\n\nPossible causes:\n• Repository ${owner}/${repo} doesn't exist\n• Repository is private and your token doesn't have access\n• Your GitHub token lacks 'issues:write' permission\n• Owner or repository name is incorrect\n\nPlease verify your GitHub configuration in Settings.`);
			} else if (error.status === 401) {
				alert(`GitHub API Error: Unauthorized\n\nYour GitHub token is invalid, expired, or doesn't have the required permissions.\n\nPlease update your token in Settings with proper 'repo' or 'issues:write' scope.`);
			} else if (error.status === 403) {
				alert(`GitHub API Error: Forbidden\n\nYour GitHub token doesn't have permission to create issues in this repository.\n\nEnsure your token has 'repo' scope for private repos or 'public_repo' scope for public repos.`);
			} else {
				alert(`Failed to create GitHub issue: ${error.message || error}`);
			}
			
			setSaveState('idle');
		}
	};

	const handleSearch = () => {
		const owner = githubConfig.owner;
		const repo = githubConfig.repo;
		
		if (!owner || !repo) {
			alert("GitHub configuration incomplete!\n\nPlease configure your GitHub owner and repository in Settings before searching bookmarks.");
			return;
		}
		
		const searchUrl = `https://github.com/${owner}/${repo}/issues`;
		if (typeof chrome !== "undefined" && chrome.tabs) {
			chrome.tabs.create({ url: searchUrl });
		} else {
			window.open(searchUrl, '_blank');
		}
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
