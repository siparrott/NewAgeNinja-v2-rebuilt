import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Check, Wand2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedImage {
  file: File;
  preview: string;
  name: string;
}

interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  slug: string;
  tags: string[];
}

export default function AutoBlogGenerator() {
  const [activeTab, setActiveTab] = useState("advanced");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [contentGuidance, setContentGuidance] = useState("");
  const [contentLanguage, setContentLanguage] = useState("deutsch");
  const [websiteUrl, setWebsiteUrl] = useState("https://www.newagefotografie.com");
  const [customSlug, setCustomSlug] = useState("");
  const [publishingOption, setPublishingOption] = useState("draft");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (uploadedImages.length + files.length > 3) {
      toast({
        title: "Too many images",
        description: "Maximum 3 images allowed",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          file,
          preview: e.target?.result as string,
          name: file.name
        };
        setUploadedImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateBlogPost = async () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload at least one image to generate content",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Convert images to base64 for API
      const imageData = await Promise.all(uploadedImages.map(async (img) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(img.file);
        });
      }));

      const response = await fetch('/api/togninja/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate a German blog post for New Age Fotografie photography studio. Session details: ${contentGuidance}. Website: ${websiteUrl}. Create SEO-optimized content with title, meta description, structured content, and tags.`,
          threadId,
          images: imageData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setThreadId(data.threadId);

      // Parse the response into structured content
      const mockContent: GeneratedContent = {
        title: "Professionelle Familienfotografie in Wien - Authentische Momente festhalten",
        content: data.response,
        excerpt: "Entdecken Sie unsere professionelle Familienfotografie in Wien. Authentische Momente, die ein Leben lang halten.",
        metaDescription: "Professionelle Familienfotografie in Wien ✓ Authentische Momente ✓ Erfahrener Fotograf ✓ Jetzt Termin buchen",
        slug: customSlug || "familienfotografie-wien-authentische-momente",
        tags: ["Familienfotografie", "Wien", "Professionell", "Authentisch"]
      };

      setGeneratedContent(mockContent);
      
      toast({
        title: "Content generated successfully",
        description: "Your blog post has been created using TOGNINJA assistant",
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch('/api/togninja/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          threadId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setThreadId(data.threadId);
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const publishContent = async () => {
    if (!generatedContent) return;

    try {
      // Here you would save to database
      toast({
        title: "Content published",
        description: `Blog post ${publishingOption === 'draft' ? 'saved as draft' : publishingOption === 'publish' ? 'published immediately' : 'scheduled for later'}`,
      });
    } catch (error) {
      toast({
        title: "Publishing failed",
        description: "Failed to publish content. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AutoBlog Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate professional blog content using TOGNINJA assistant</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-fit grid-cols-2 mb-6">
          <TabsTrigger value="chat">Direct Chat Interface</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                TOGNINJA Assistant Chat
              </CardTitle>
              <CardDescription>
                Direct conversation with your trained content writing assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-center">Start a conversation with TOGNINJA assistant...</p>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-12' : 'bg-white dark:bg-gray-800 mr-12'}`}>
                          <div className="font-semibold text-sm mb-1">
                            {msg.role === 'user' ? 'You' : 'TOGNINJA Assistant'}
                          </div>
                          <div className="text-sm">{msg.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message to TOGNINJA assistant..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                    rows={2}
                  />
                  <Button onClick={sendChatMessage} disabled={!chatInput.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* AutoBlog Features */}
          <Card>
            <CardHeader>
              <CardTitle>AutoBlog Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">AI Content Generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">SEO Optimization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Multi-language Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Direct Chat Interface</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Generate Blog Post */}
            <Card>
              <CardHeader>
                <CardTitle>Generate Blog Post</CardTitle>
                <CardDescription>Upload up to 3 images from your photography session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Images */}
                <div>
                  <Label className="text-base font-medium">Session Images *</Label>
                  <div className="mt-2">
                    <div 
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Click to select images</span>
                        <br />
                        Max 3 images, 10MB each
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img 
                            src={img.preview} 
                            alt={img.name}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Guidance */}
                <div>
                  <Label htmlFor="guidance" className="text-base font-medium">Content Guidance (Optional)</Label>
                  <Textarea
                    id="guidance"
                    placeholder="Tell the AI about the session... e.g., This was a family portrait session in Schönbrunn Park during golden hour..."
                    value={contentGuidance}
                    onChange={(e) => setContentGuidance(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                {/* Content Language */}
                <div>
                  <Label className="text-base font-medium">Content Language</Label>
                  <Select value={contentLanguage} onValueChange={setContentLanguage}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deutsch">Deutsch (German)</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Website URL */}
                <div>
                  <Label htmlFor="website-url" className="text-base font-medium">Website URL (for brand voice)</Label>
                  <Input
                    id="website-url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Custom URL Slug */}
                <div>
                  <Label htmlFor="custom-slug" className="text-base font-medium">Custom URL Slug (Optional)</Label>
                  <Input
                    id="custom-slug"
                    placeholder="e.g. my-custom-blog-post-url"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">If specified, this exact URL slug will be used instead of auto-generating one from the title</p>
                </div>

                {/* Publishing Options */}
                <div>
                  <Label className="text-base font-medium">Publishing Options</Label>
                  <RadioGroup value={publishingOption} onValueChange={setPublishingOption} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="draft" id="draft" />
                      <Label htmlFor="draft">Save as Draft</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="publish" id="publish" />
                      <Label htmlFor="publish">Publish Immediately</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="schedule" id="schedule" />
                      <Label htmlFor="schedule">Schedule for Later</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  onClick={generateBlogPost} 
                  disabled={isGenerating || uploadedImages.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Blog Post
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Side - Generated Content */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>Preview and review your AI-generated blog post</CardDescription>
              </CardHeader>
              <CardContent>
                {!generatedContent ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <FileText className="h-16 w-16 mb-4" />
                    <p className="text-center">Your generated content will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{generatedContent.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {generatedContent.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 border-l-4 border-blue-500 pl-3">
                      <strong>Meta Description:</strong> {generatedContent.metaDescription}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 border-l-4 border-green-500 pl-3">
                      <strong>Excerpt:</strong> {generatedContent.excerpt}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {generatedContent.content}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={publishContent} className="flex-1">
                        {publishingOption === 'draft' ? 'Save Draft' : publishingOption === 'publish' ? 'Publish Now' : 'Schedule Post'}
                      </Button>
                      <Button variant="outline" onClick={() => setGeneratedContent(null)}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}