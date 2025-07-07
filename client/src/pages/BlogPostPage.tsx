import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  content_html: string;
  image_url: string | null;
  published_at: string;
  excerpt: string | null;
  author: {
    email: string;
  } | null;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/blog/posts/${postSlug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Blog post not found');
        } else {
          setError('Failed to load blog post');
        }
        return;
      }
      
      const data = await response.json();
      setPost(data);
      
      // Fetch related posts
      fetchRelatedPosts(data.id);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load blog post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (currentPostId: string) => {
    try {
      const response = await fetch(`/api/blog/posts?published=true&limit=3&exclude=${currentPostId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRelatedPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching related posts:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {error || 'Blog post not found'}
            </h1>
            <p className="text-gray-600 mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to blog
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | New Age Fotografie Blog</title>
        <meta name="description" content={post.excerpt || `Read about ${post.title}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || `Read about ${post.title}`} />
        {post.image_url && <meta property="og:image" content={post.image_url} />}
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://newagefotografie.com/blog/${post.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": post.image_url ? [post.image_url] : [],
            "datePublished": post.published_at,
            "dateModified": post.published_at,
            "author": {
              "@type": "Person",
              "name": "New Age Fotografie"
            },
            "publisher": {
              "@type": "Organization",
              "name": "New Age Fotografie",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.newagefotografie.com/logo.png"
              }
            },
            "description": post.excerpt || `Read about ${post.title}`
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Link
          to="/blog"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to blog
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Post Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center text-gray-600 mb-6">
              <div className="flex items-center mr-6">
                <Calendar size={16} className="mr-1" />
                <span>{formatDate(post.published_at)}</span>
              </div>
              
              {post.author && (
                <div className="flex items-center">
                  <span>By {post.author.email.split('@')[0]}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Cover Image */}
          {post.image_url && (
            <div className="mb-8">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
                onError={(e) => {
                  console.error('Failed to load image:', post.image_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Post Content */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content_html || post.content }}
            />
          </div>
          
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.slug}`}
                    className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:-translate-y-1"
                  >
                    <div className="h-40 overflow-hidden">
                      {relatedPost.image_url ? (
                        <img
                          src={relatedPost.image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            console.error('Failed to load related post image:', relatedPost.image_url);
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.classList.add('bg-gray-200');
                            e.currentTarget.parentElement!.classList.add('flex');
                            e.currentTarget.parentElement!.classList.add('items-center');
                            e.currentTarget.parentElement!.classList.add('justify-center');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Clock size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <span className="text-purple-600 text-sm">Read more</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BlogPostPage;