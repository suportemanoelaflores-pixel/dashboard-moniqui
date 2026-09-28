// Busca dados públicos de um perfil do Instagram via Apify (instagram-profile-scraper).
// A chave fica na variável de ambiente APIFY_TOKEN do Netlify, nunca no navegador.
//
// GET /.netlify/functions/instagram?user=fulana   → inicia a busca  → { run }
// GET /.netlify/functions/instagram?run=<id>      → consulta status → { status, profile? }
//
// A busca leva ~15–40s, então é feita em duas etapas (as funções do Netlify têm limite de 10s).

const ACTOR = 'apify~instagram-profile-scraper';
const API = 'https://api.apify.com/v2';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
  });

async function fotoComoDataUrl(url){
  if (!url) return null;
  try {
    const r = await fetch(url, {signal: AbortSignal.timeout(4000)});
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 400_000) return null;
    return `data:${r.headers.get('content-type') || 'image/jpeg'};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

function resumir(p){
  const posts = (p.latestPosts || []).map(x => ({
    tipo: x.type,
    data: x.timestamp,
    curtidas: x.likesCount ?? null,
    comentarios: x.commentsCount ?? null,
  }));
  return {
    username: p.username,
    nome: p.fullName || '',
    bio: p.biography || '',
    link: p.externalUrl || (p.externalUrls && p.externalUrls[0] && p.externalUrls[0].url) || '',
    seguidores: p.followersCount ?? null,
    seguindo: p.followsCount ?? null,
    totalPosts: p.postsCount ?? null,
    verificado: !!p.verified,
    privado: !!p.private,
    posts,
  };
}

export default async (req) => {
  const token = (process.env.APIFY_TOKEN || '').trim();
  if (!token) return json({error: 'APIFY_TOKEN não configurado'}, 500);

  const q = new URL(req.url).searchParams;
  const user = (q.get('user') || '').trim().replace(/^@/, '').toLowerCase();
  const run = (q.get('run') || '').trim();

  try {
    if (user){
      if (!/^[a-z0-9._]{1,30}$/.test(user)) return json({error: 'usuário inválido'}, 400);
      const r = await fetch(`${API}/acts/${ACTOR}/runs?token=${token}&memory=512&timeout=120`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({usernames: [user]}),
      });
      const d = await r.json();
      if (!r.ok || !d.data) return json({error: 'falha ao iniciar busca', apify: (d.error && (d.error.type + ': ' + d.error.message)) || `HTTP ${r.status}`}, 502);
      return json({run: d.data.id});
    }

    if (run){
      if (!/^[A-Za-z0-9]{5,40}$/.test(run)) return json({error: 'run inválido'}, 400);
      const r = await fetch(`${API}/actor-runs/${run}?token=${token}`);
      const d = await r.json();
      const status = d.data && d.data.status;
      if (!status) return json({error: 'run não encontrado'}, 404);
      if (status === 'RUNNING' || status === 'READY') return json({status: 'RUNNING'});
      if (status !== 'SUCCEEDED') return json({status: 'FAILED', apify: d.data.statusMessage || status});

      const it = await fetch(`${API}/datasets/${d.data.defaultDatasetId}/items?token=${token}&clean=true&limit=1`);
      const items = await it.json();
      const p = Array.isArray(items) && items[0];
      if (!p || !p.username || p.error) return json({status: 'NOT_FOUND'});

      const profile = resumir(p);
      profile.foto = await fotoComoDataUrl(p.profilePicUrlHD || p.profilePicUrl);
      return json({status: 'DONE', profile});
    }

    return json({error: 'use ?user= ou ?run='}, 400);
  } catch (e){
    return json({error: 'erro inesperado', detalhe: String(e && e.message || e)}, 500);
  }
};
