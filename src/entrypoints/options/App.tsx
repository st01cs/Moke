import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import "../global.css";
import { Octokit } from "octokit";
import { Check, X, AlertCircle } from "lucide-react";

function OptionsApp() {
  const [form, setForm] = useState({
    owner: "",
    repo: "",
    token: ""
  });
  const [connectState, setConnectState] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [tokenMasked, setTokenMasked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // chrome对象声明，避免TS报错
  // @ts-ignore
  const chromeObj = typeof chrome !== 'undefined' ? chrome : undefined;

  // 读取已保存配置
  useEffect(() => {
    if (chromeObj && chromeObj.storage && chromeObj.storage.sync) {
      chromeObj.storage.sync.get([
        "githubConnected", "githubToken", "githubOwner", "githubRepo"
      ], (result: any) => {
        if (result.githubConnected) {
          setConnected(true);
          setForm({
            owner: result.githubOwner || "",
            repo: result.githubRepo || "",
            token: result.githubToken ? "******" : ""
          });
          setTokenMasked(!!result.githubToken);
        }
      });
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    // 如果token输入框被编辑，去掉掩码
    if (field === "token" && tokenMasked) {
      setTokenMasked(false);
    }
    // 清除错误消息当用户开始编辑
    if (connectState === 'error') {
      setConnectState('idle');
      setErrorMessage("");
    }
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // 验证表单输入
  const validateForm = () => {
    if (!form.owner.trim()) {
      return "Owner 不能为空";
    }
    if (!form.repo.trim()) {
      return "Repo 不能为空";
    }
    if (!form.token.trim()) {
      return "Personal access token 不能为空";
    }
    return null;
  };

  const handleConnect = async () => {
    setLoading(true);
    setConnectState('idle');
    setErrorMessage("");

    // 表单验证
    const validationError = validateForm();
    if (validationError) {
      setConnectState('error');
      setErrorMessage(validationError);
      setLoading(false);
      return;
    }

    try {
      const octokit = new Octokit({ auth: form.token });
      
      // 验证token有效性
      try {
        await octokit.rest.users.getAuthenticated();
      } catch (e: any) {
        if (e.status === 401) {
          throw new Error("Personal access token 无效或已过期");
        } else if (e.status === 403) {
          throw new Error("Personal access token 权限不足");
        } else {
          throw new Error("无法验证 token，请检查网络连接");
        }
      }

      // 验证是否能读取指定repo的issues
      try {
        await octokit.rest.issues.listForRepo({
          owner: form.owner,
          repo: form.repo,
          per_page: 1
        });
      } catch (e: any) {
        if (e.status === 404) {
          throw new Error(`仓库 "${form.owner}/${form.repo}" 不存在或您没有访问权限`);
        } else if (e.status === 403) {
          throw new Error("Token 缺少 repo 权限，请在 GitHub 设置中为 token 添加 repo 权限");
        } else {
          throw new Error(`无法访问仓库: ${e.message || '未知错误'}`);
        }
      }

      setConnectState('success');
      setErrorMessage("");
      
      // 保存到chrome.storage.sync
      if (chromeObj && chromeObj.storage && chromeObj.storage.sync) {
        chromeObj.storage.sync.set({
          githubToken: form.token,
          githubOwner: form.owner,
          githubRepo: form.repo,
          githubConnected: true
        });
      }
    } catch (e: any) {
      setConnectState('error');
      setErrorMessage(e.message || "连接失败，请检查配置");
      if (chromeObj && chromeObj.storage && chromeObj.storage.sync) {
        chromeObj.storage.sync.set({
          githubConnected: false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-96 p-6 light relative">
      {/* 右上角错误提示 */}
      {connectState === 'error' && errorMessage && (
        <div className="absolute top-2 right-2 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-2 p-3 bg-red-500 text-white rounded-lg shadow-lg max-w-80">
            <AlertCircle className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
            <div className="text-sm font-medium">{errorMessage}</div>
            <button
              onClick={() => {
                setConnectState('idle');
                setErrorMessage("");
              }}
              className="ml-2 text-white hover:text-red-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 右上角成功提示 */}
      {connectState === 'success' && (
        <div className="absolute top-2 right-2 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-2 p-3 bg-green-500 text-white rounded-lg shadow-lg">
            <Check className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
            <div className="text-sm font-medium">连接成功！GitHub 配置已保存。</div>
            <button
              onClick={() => setConnectState('idle')}
              className="ml-2 text-white hover:text-green-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <form className="space-y-4">
        {/* Owner */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="owner">Owner</Label>
            <a href="https://github.com/join?source=login" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Join GitHub</a>
          </div>
          <Input
            id="owner"
            value={form.owner}
            onChange={e => handleChange("owner", e.target.value)}
            placeholder="st01cs"
            className={connectState === 'error' && !form.owner.trim() ? "border-red-500" : ""}
          />
        </div>
        {/* Repo */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="repo">Repo</Label>
            <a href="https://github.com/login?return_to=%2Fst01cs%2Fbookmarkhub-template%2Fgenerate" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Create repo</a>
          </div>
          <Input
            id="repo"
            value={form.repo}
            onChange={e => handleChange("repo", e.target.value)}
            placeholder="bookmarks"
            className={connectState === 'error' && !form.repo.trim() ? "border-red-500" : ""}
          />
        </div>
        {/* Token */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="token">Personal access token<span className="text-red-500">*</span></Label>
            <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Create token</a>
          </div>
          <Input
            id="token"
            type="password"
            value={form.token}
            onChange={e => handleChange("token", e.target.value)}
            placeholder=""
            autoComplete="off"
            className={connectState === 'error' && !form.token.trim() ? "border-red-500" : ""}
          />
          <div className="text-xs text-gray-500 mt-1 pl-1">* The <span className="font-mono">repo</span> scope is required.</div>
        </div>

        {/* Connect Button */}
        <div className="pt-2 flex justify-center">
          <Button type="button" className="w-full flex items-center justify-center gap-2" onClick={handleConnect} disabled={loading}>
            {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {connectState === 'success' && !loading && <Check className="h-4 w-4 text-green-600" />}
            {connectState === 'error' && !loading && <X className="h-4 w-4 text-red-600" />}
            <span className="underline decoration-dotted">
              {loading ? "连接中..." : "Connect"}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default OptionsApp; 