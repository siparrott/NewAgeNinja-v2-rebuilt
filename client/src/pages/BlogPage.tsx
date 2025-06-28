import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { Calendar, ChevronRight, Tag, Search, Loader2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_html?: string;
  image_url?: string;
  published: boolean;
  author_id: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

const BlogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Get query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';
  
  useEffect(() => {
    fetchData();
  }, [page, tag, search]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch posts
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' });
      
      // Filter by published status
      query = query.eq('published', true);
      
      // Filter by tag if specified
      if (tag) {
        query = query.contains('tags', [tag]);
      }
      
      // Filter by search term if specified
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
      }
      
      // Pagination
      const pageSize = 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Order by published date
      query = query.order('published_at', { ascending: false });
      
      // Execute query with pagination
      const { data: postsData, error: postsError, count } = await query.range(from, to);
      
      if (postsError) throw postsError;
      
      setPosts(postsData || []);
      setTotalPosts(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
      // Fetch tags if not already loaded
      if (tags.length === 0) {
        const { data: tagsData, error: tagsError } = await supabase
          .from('blog_tags')
          .select('*')
          .order('name');
        
        if (tagsError) throw tagsError;
        
        setTags(tagsData || []);
      }
    } catch (err) {
      console.error('Error fetching blog data:', err);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newSearchParams.set('search', e.target.value);
    } else {
      newSearchParams.delete('search');
    }
    newSearchParams.set('page', '1'); // Reset to first page on new search
    setSearchParams(newSearchParams);
  };
  
  const handleTagClick = (tagSlug: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (tagSlug === tag) {
      newSearchParams.delete('tag');
    } else {
      newSearchParams.set('tag', tagSlug);
    }
    newSearchParams.set('page', '1'); // Reset to first page on tag change
    setSearchParams(newSearchParams);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Photography Blog
            </h1>
            <p className="text-purple-100 text-lg">
              Tips, inspirations, and insights into the world of professional photography
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-8 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading posts...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map(post => (
                  <article 
                    key={post.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
                  >
                    {(post.image_url || true) && (
                      <Link to={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-gray-100">
                        <img 
                          src={post.image_url || '/frontend-logo.jpg'} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            console.error('Failed to load image:', post.image_url);
                            // Fallback to default image
                            if (e.currentTarget.src !== '/frontend-logo.jpg') {
                              e.currentTarget.src = '/frontend-logo.jpg';
                            } else {
                              // If even the fallback fails, hide the image container
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.classList.add('hidden');
                            }
                          }}
                        />
                      </Link>
                    )}
                    
                    <div className="p-6">
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center mb-3">
                          <Tag size={16} className="text-purple-600 mr-2" />
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tagName, index) => {
                              const tagObj = tags.find(t => t.name === tagName);
                              return tagObj ? (
                                <span 
                                  key={index}
                                  className="text-sm text-purple-600 cursor-pointer hover:text-purple-800"
                                  onClick={() => handleTagClick(tagObj.slug)}
                                >
                                  {tagName}
                                  {index < post.tags!.length - 1 && ", "}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                        <Link to={`/blog/${post.slug}`} className="hover:text-purple-600 transition-colors">
                          {post.title}
                        </Link>
                      </h2>
                      
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center text-sm text-gray-500 mb-3 gap-4">
                        {post.published_at && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {formatDate(post.published_at)}
                          </div>
                        )}
                      </div>
                      
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center"
                      >
                        Read more
                        <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">No posts found</h2>
                <p className="text-gray-600 mb-4">
                  {search || tag 
                    ? "No posts match your search criteria. Try adjusting your filters."
                    : "We haven't published any blog posts yet. Check back soon!"}
                </p>
                {(search || tag) && (
                  <button
                    onClick={() => {
                      setSearchParams(new URLSearchParams());
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => {
                      if (page > 1) {
                        const newSearchParams = new URLSearchParams(searchParams);
                        newSearchParams.set('page', (page - 1).toString());
                        setSearchParams(newSearchParams);
                      }
                    }}
                    disabled={page === 1}
                    className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 ${
                      page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        const newSearchParams = new URLSearchParams(searchParams);
                        newSearchParams.set('page', pageNum.toString());
                        setSearchParams(newSearchParams);
                      }}
                      className={`px-4 py-2 text-sm font-medium ${
                        pageNum === page
                          ? 'bg-purple-600 text-white border border-purple-600'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => {
                      if (page < totalPages) {
                        const newSearchParams = new URLSearchParams(searchParams);
                        newSearchParams.set('page', (page + 1).toString());
                        setSearchParams(newSearchParams);
                      }
                    }}
                    disabled={page === totalPages}
                    className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 ${
                      page === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Tags */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Categories</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleTagClick('')}
                    className={`flex items-center text-gray-600 hover:text-purple-600 transition-colors ${
                      tag === '' ? 'text-purple-600 font-medium' : ''
                    }`}
                  >
                    <ChevronRight size={16} className="mr-2" />
                    All Categories
                  </button>
                </li>
                {tags.map((tagItem) => (
                  <li key={tagItem.id}>
                    <button
                      onClick={() => handleTagClick(tagItem.slug)}
                      className={`flex items-center text-gray-600 hover:text-purple-600 transition-colors ${
                        tag === tagItem.slug ? 'text-purple-600 font-medium' : ''
                      }`}
                    >
                      <ChevronRight size={16} className="mr-2" />
                      {tagItem.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-purple-50 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Newsletter</h2>
              <p className="text-gray-600 mb-4">
                Stay updated with our latest photography tips and special offers.
              </p>
              <form className="space-y-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                />
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogPage;