// ============================================================
// ORACLE VERITY — GITHUB API SERVICE
// ============================================================

export interface GithubCommit {
  sha: string;
  message: string;
  authorLogin: string; // The exact GitHub username or fallback to raw git name
  date: string;
}

export interface GithubIssue {
  number: number;
  title: string;
  state: string;
  user: string;
  url: string;
}

export interface GithubContext {
  repo: string;
  stars: number;
  openIssuesCount: number;
  commits: GithubCommit[];
  issues: GithubIssue[];
}

export async function fetchGithubContext(repoSlug: string, token?: string): Promise<GithubContext | null> {
  if (!repoSlug) return null;
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    // Fetch Repo Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${repoSlug}`, { headers });
    let stars = 0;
    let openIssuesCount = 0;
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      stars = repoData.stargazers_count || 0;
      openIssuesCount = repoData.open_issues_count || 0;
    }

    // Fetch latest 5 commits
    const commitsRes = await fetch(`https://api.github.com/repos/${repoSlug}/commits?per_page=5`, { headers });
    let commits: GithubCommit[] = [];
    if (commitsRes.ok) {
      const commitsData = await commitsRes.json();
      commits = commitsData.map((c: any) => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message.split('\n')[0],
        authorLogin: c.author?.login || c.commit.author.name || 'Unknown',
        date: c.commit.author.date,
      }));
    }

    // Fetch latest 5 open issues/PRs
    const issuesRes = await fetch(`https://api.github.com/repos/${repoSlug}/issues?state=open&per_page=5`, { headers });
    let issues: GithubIssue[] = [];
    if (issuesRes.ok) {
      const issuesData = await issuesRes.json();
      issues = issuesData.map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        user: i.user.login,
        url: i.html_url,
      }));
    }

    return {
      repo: repoSlug,
      stars,
      openIssuesCount,
      commits,
      issues
    };

  } catch (error) {
    console.error('Failed to fetch GitHub context:', error);
    return null;
  }
}
