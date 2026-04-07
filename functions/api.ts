/**
 * Cloudflare Pages Function - 自动映射到 /api 路由
 */
export const onRequest: PagesFunction<{ DRAWNIX_KV: KVNamespace }> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || 'default-board';

  // 1. 保存数据 (POST)
  if (request.method === 'POST') {
    try {
      const data = await request.text();
      // 直接存入绑定的 KV 空间
      await env.DRAWNIX_KV.put(id, data);
      return new Response('OK');
    } catch (e) {
      return new Response('Save Error', { status: 500 });
    }
  }

  // 2. 读取数据 (GET)
  const data = await env.DRAWNIX_KV.get(id);
  
  // 如果没有数据，返回 404 给前端触发新画板逻辑
  if (!data) {
    return new Response(JSON.stringify({ children: [] }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(data, {
    headers: { 'Content-Type': 'application/json' }
  });
};