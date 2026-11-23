import React, { useMemo, useState } from 'react';

// Maps Winget / MS Store package IDs & known publishers to official high-res icons
// Falls back cleanly to a deterministic crisp monogram badge when offline or unmapped.
const EXACT_ICON_MAP: Record<string, string> = {
  'google.chrome': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/google-chrome.png',
  'mozilla.firefox': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/firefox.png',
  'brave.brave': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/brave.png',
  'thebrowsercompany.arc': 'https://www.google.com/s2/favicons?domain=arc.net&sz=64',
  'tonec.internetdownloadmanager': 'https://www.google.com/s2/favicons?domain=internetdownloadmanager.com&sz=64',
  'cloudflare.warp': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/cloudflare.png',
  'tailscale.tailscale': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/tailscale.png',
  'qbittorrent.qbittorrent': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/qbittorrent.png',
  'microsoft.visualstudiocode': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/visual-studio-code.png',
  'xp9cdqw6ml4n4h': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/visual-studio-code.png',
  'git.git': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/git.png',
  'openjs.nodejs.lts': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/nodejs.png',
  'python.python.3.12': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/python.png',
  'docker.dockerdesktop': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/docker.png',
  'microsoft.windowsterminal': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/windows-terminal.png',
  'microsoft.powershell': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/powershell.png',
  'postman.postman': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/postman.png',
  'github.githubdesktop': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/github.png',
  'rustlang.rustup': 'https://www.google.com/s2/favicons?domain=rust-lang.org&sz=64',
  'videolan.vlc': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/vlc.png',
  'obsproject.obsstudio': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/obs-studio.png',
  'gyan.ffmpeg': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/ffmpeg.png',
  'spotify.spotify': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/spotify.png',
  '9ncbcszsjrsb': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/spotify.png',
  'figma.figma': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/figma.png',
  'sharex.sharex': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/sharex.png',
  'blenderfoundation.blender': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/blender.png',
  'bytedance.capcut': 'https://www.google.com/s2/favicons?domain=capcut.com&sz=64',
  'notion.notion': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/notion.png',
  'obsidian.obsidian': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/obsidian.png',
  'thedocumentfoundation.libreoffice': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/libreoffice.png',
  'foxit.foxitreader': 'https://www.google.com/s2/favicons?domain=foxit.com&sz=64',
  'sumatrapdf.sumatrapdf': 'https://www.google.com/s2/favicons?domain=sumatrapdfreader.org&sz=64',
  'anki.anki': 'https://www.google.com/s2/favicons?domain=apps.ankiweb.net&sz=64',
  'zoom.zoom': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/zoom.png',
  '7zip.7zip': 'https://www.google.com/s2/favicons?domain=7-zip.org&sz=64',
  'rarlab.winrar': 'https://www.google.com/s2/favicons?domain=win-rar.com&sz=64',
  'microsoft.powertoys': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/powertoys.png',
  'voidtools.everything': 'https://www.google.com/s2/favicons?domain=voidtools.com&sz=64',
  'guru3d.afterburner': 'https://www.google.com/s2/favicons?domain=msi.com&sz=64',
  'cpuid.cpu-z': 'https://www.google.com/s2/favicons?domain=cpuid.com&sz=64',
  'crystaldewworld.crystaldiskinfo': 'https://www.google.com/s2/favicons?domain=crystalmark.info&sz=64',
  'antibodysoftware.wiztree': 'https://www.google.com/s2/favicons?domain=diskanalyzer.com&sz=64',
  'bitwarden.bitwarden': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/bitwarden.png',
  'unikey.unikey': 'https://www.google.com/s2/favicons?domain=unikey.org&sz=64',
  'discord.discord': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/discord.png',
  'telegram.telegramdesktop': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/telegram.png',
  'valve.steam': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/steam.png',
  '9nksqgp7f2nh': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/whatsapp.png',
  '9wzdncrfj3tj': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/netflix.png',
  '9nblggh5l9xt': 'https://www.google.com/s2/favicons?domain=eartrumpet.app&sz=64',
  '9nw33j738bl0': 'https://www.google.com/s2/favicons?domain=screenbox.app&sz=64',
  'microsoft.pcmanager': 'https://www.google.com/s2/favicons?domain=pcmanager.microsoft.com&sz=64',
  '9pm860492szd': 'https://www.google.com/s2/favicons?domain=pcmanager.microsoft.com&sz=64',
};

const PUBLISHER_DOMAIN_MAP: Record<string, string> = {
  microsoft: 'microsoft.com',
  google: 'google.com',
  mozilla: 'mozilla.org',
  jetbrains: 'jetbrains.com',
  adobe: 'adobe.com',
  nvidia: 'nvidia.com',
  amd: 'amd.com',
  intel: 'intel.com',
  github: 'github.com',
  docker: 'docker.com',
  valve: 'steampowered.com',
  epicgames: 'epicgames.com',
  discord: 'discord.com',
  telegram: 'telegram.org',
  spotify: 'spotify.com',
  figma: 'figma.com',
  canva: 'canva.com',
  notion: 'notion.so',
  obsidian: 'obsidian.md',
  brave: 'brave.com',
  cloudflare: 'cloudflare.com',
  python: 'python.org',
  openjs: 'nodejs.org',
  rustlang: 'rust-lang.org',
  videolan: 'videolan.org',
  obsproject: 'obsproject.com',
  zoom: 'zoom.us',
  slacktechnologies: 'slack.com',
};

function resolveIconUrl(id: string): string | null {
  const lower = id.toLowerCase().trim();
  if (EXACT_ICON_MAP[lower]) return EXACT_ICON_MAP[lower];
  const prefix = lower.split('.')[0];
  if (prefix && PUBLISHER_DOMAIN_MAP[prefix]) {
    return `https://www.google.com/s2/favicons?domain=${PUBLISHER_DOMAIN_MAP[prefix]}&sz=64`;
  }
  return null;
}

function getInitials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  if (!clean) return 'AP';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

interface AppIconProps {
  id: string;
  name: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ id, name, size = 34 }) => {
  const [failed, setFailed] = useState(false);
  const url = useMemo(() => resolveIconUrl(id), [id]);
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <span
      className="app-icon-box"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {url && !failed ? (
        <img
          src={url}
          alt=""
          width={Math.round(size * 0.64)}
          height={Math.round(size * 0.64)}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="app-icon-fallback">{initials}</span>
      )}
    </span>
  );
};
