/**
 * Shared blog component for client landing pages.
 *
 * Usage: Include Supabase CDN, then this script.
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
 *   <script src="/shared/blog.js"></script>
 *   <script>loadBlogPosts('client-slug');</script>
 *
 * Expects a container with id="blog-posts" in the HTML.
 */

(function () {
    'use strict';

    var SUPABASE_URL = 'https://apchqzlmhnwgnwpofemf.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwY2hxemxtaG53Z253cG9mZW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjI5OTYsImV4cCI6MjA4NTkzODk5Nn0.cV2Y9D1cEzJ1tQgS_MfxPDaEqK65KNHep95-fi33cak';

    var sb = null;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return d.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    function createExcerpt(content, maxLength) {
        maxLength = maxLength || 160;
        var text = content.replace(/[#*_`>\-\[\]()!]/g, '').replace(/\n+/g, ' ').trim();
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    }

    function renderPostCard(post, clientSlug) {
        var excerpt = post.excerpt || createExcerpt(post.content);
        var date = formatDate(post.published_at);
        var postUrl = '/shared/blog-post.html?client=' + encodeURIComponent(clientSlug) + '&post=' + encodeURIComponent(post.slug);

        var card = document.createElement('a');
        card.href = postUrl;
        card.className = 'blog-card';
        card.innerHTML =
            '<div class="blog-card-content">' +
                '<time class="blog-card-date">' + date + '</time>' +
                '<h3 class="blog-card-title">' + escapeHtml(post.title) + '</h3>' +
                '<p class="blog-card-excerpt">' + escapeHtml(excerpt) + '</p>' +
                '<span class="blog-card-link">Weiterlesen <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle">arrow_forward</span></span>' +
            '</div>';
        return card;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    window.loadBlogPosts = async function (clientSlug, options) {
        options = options || {};
        var containerId = options.containerId || 'blog-posts';
        var limit = options.limit || 6;
        var container = document.getElementById(containerId);
        if (!container) return;

        if (!sb) {
            container.innerHTML = '<p class="text-muted">Blog nicht verfügbar.</p>';
            return;
        }

        try {
            // Check if blog is enabled for this client
            var clientResult = await sb
                .from('clients')
                .select('blog_enabled')
                .eq('slug', clientSlug)
                .single();

            if (clientResult.error || !clientResult.data || !clientResult.data.blog_enabled) {
                // Blog not enabled — hide section entirely
                var blogSection = container.closest('section');
                if (blogSection) blogSection.style.display = 'none';
                return;
            }

            // Fetch published posts
            var result = await sb
                .from('blog_posts')
                .select('title, slug, excerpt, content, published_at')
                .eq('client', clientSlug)
                .eq('status', 'published')
                .order('published_at', { ascending: false })
                .limit(limit);

            if (result.error) throw result.error;

            if (!result.data || result.data.length === 0) {
                container.innerHTML = '<p class="text-muted">Noch keine Beiträge vorhanden.</p>';
                return;
            }

            container.innerHTML = '';
            var grid = document.createElement('div');
            grid.className = 'blog-grid';

            result.data.forEach(function (post) {
                grid.appendChild(renderPostCard(post, clientSlug));
            });

            container.appendChild(grid);
        } catch (err) {
            console.error('Blog laden fehlgeschlagen:', err);
            container.innerHTML = '<p class="text-muted">Blog konnte nicht geladen werden.</p>';
        }
    };
})();
