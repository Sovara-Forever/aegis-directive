import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileTextIcon, DownloadIcon, CheckCircle2Icon, Clock} from 'lucide-react';

interface ContentSuggestion {
  id: string;
  dealership_id: string;
  template_type: string;
  target_keyword: string;
  our_rank_before: number | null;
  competitor_rank_before: number | null;
  competitor_domain: string | null;
  gap_analysis: any;
  html_output: string | null;
  css_output: string | null;
  json_ld_output: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: 'pending' | 'generated' | 'published' | 'tracking';
  llm_provider: string | null;
  generation_cost: number | null;
  serp_improvement: number | null;
  traffic_gain: number | null;
  created_at: string;
  published_at: string | null;
  tracking_start: string | null;
}

interface ContentGenerationProps {
  selectedDealership: string;
}

export default function ContentGeneration({ selectedDealership }: ContentGenerationProps) {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dealershipId, setDealershipId] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [selectedDealership]);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Look up dealership UUID from name
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealerships')
        .select('id')
        .eq('name', selectedDealership)
        .single();

      if (dealerError) {
        console.error('Dealership lookup error:', dealerError);
        setError(`Dealership "${selectedDealership}" not found in database`);
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const dId = dealerData?.id;
      setDealershipId(dId);

      if (!dId) {
        setError(`Dealership "${selectedDealership}" not found`);
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch content suggestions for dealership (UUID schema)
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('dealership_id', dId)
        .order('created_at', { ascending: false })
        .limit(10);  // Show up to 10 suggestions (5 active + 5 historical)

      if (error) {
        console.error('Error loading suggestions:', error);
        setError(error.message);
      } else {
        setSuggestions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(suggestion: ContentSuggestion) {
    // MVP: Alert user to run truth_serum_v3_competitive.py manually
    alert(
      `Generate content for: ${suggestion.target_keyword}\n\n` +
      `Template: ${suggestion.template_type}\n\n` +
      `Next steps:\n` +
      `1. Open terminal\n` +
      `2. cd ~/ara_project\n` +
      `3. source .venv/bin/activate\n` +
      `4. python truth_serum_v3_competitive.py\n` +
      `5. Follow prompts to generate article\n` +
      `6. Download HTML/CSS from normalized_output/\n\n` +
      `Tip: Copy this keyword: "${suggestion.target_keyword}"`
    );
  }

  async function handleDownload(suggestion: ContentSuggestion) {
    if (!suggestion.html_output) {
      alert('No HTML content available yet. Generate content first.');
      return;
    }

    // Create downloadable HTML file
    const blob = new Blob([suggestion.html_output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${suggestion.target_keyword.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also download CSS if available
    if (suggestion.css_output) {
      const cssBlob = new Blob([suggestion.css_output], { type: 'text/css' });
      const cssUrl = URL.createObjectURL(cssBlob);
      const cssLink = document.createElement('a');
      cssLink.href = cssUrl;
      cssLink.download = `${suggestion.target_keyword.replace(/\s+/g, '_')}.css`;
      document.body.appendChild(cssLink);
      cssLink.click();
      document.body.removeChild(cssLink);
      URL.revokeObjectURL(cssUrl);
    }
  }

  async function handleMarkPublished(suggestion: ContentSuggestion) {
    const confirmed = confirm(
      `Mark "${suggestion.target_keyword}" as published?\n\n` +
      `This will:\n` +
      `- Update status to "published"\n` +
      `- Record publish timestamp\n` +
      `- Start SERP tracking for performance comparison\n\n` +
      `Have you published this content to the website?`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id);

      if (error) {
        console.error('Error marking as published:', error);
        alert(`Failed to update status: ${error.message}`);
      } else {
        alert(`✅ Content marked as published!\n\nSERP tracking started for keyword: "${suggestion.target_keyword}"`);
        loadSuggestions(); // Refresh list
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to update status');
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'default', icon: <Clock className="h-3 w-3 mr-1" /> },
      generated: { variant: 'outline', icon: <FileTextIcon className="h-3 w-3 mr-1" /> },
      published: { variant: 'default', icon: <CheckCircle2Icon className="h-3 w-3 mr-1" /> },
      tracking: { variant: 'secondary', icon: <CheckCircle2Icon className="h-3 w-3 mr-1" /> },
    };

    const { variant, icon } = variants[status] || variants.pending;

    return (
      <Badge variant={variant} className="flex items-center">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold text-text-primary">Content Generation</h1>
        <p className="text-text-secondary mt-2">
          AI-powered article suggestions for {selectedDealership}
        </p>
      </div>

      {/* Content Suggestions Table */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-2xl">Suggested Articles (Max 5/Week)</CardTitle>
          <CardDescription>
            Auto-generated content ideas based on keyword monetary value, rank gaps, and inventory alignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-text-secondary">
              <div className="animate-pulse">Loading suggestions...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-danger">
              <p>Error loading suggestions: {error}</p>
              <Button variant="outline" className="mt-4" onClick={loadSuggestions}>
                Retry
              </Button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <FileTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No suggestions yet</p>
              <p className="text-sm mt-2">
                Run <code className="bg-background px-2 py-1 rounded">truth_serum_v3_competitive.py</code> to generate content suggestions
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-text-secondary text-sm">
                    <th className="p-4">Keyword</th>
                    <th className="p-4">Template</th>
                    <th className="p-4">Our Rank</th>
                    <th className="p-4">Comp Rank</th>
                    <th className="p-4">Gap</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((suggestion) => {
                    const ourRank = suggestion.our_rank_before;
                    const compRank = suggestion.competitor_rank_before;
                    const gap = ourRank && compRank ? compRank - ourRank : null;
                    const gapColor = gap === null ? 'text-text-secondary' : gap > 0 ? 'text-success' : 'text-danger';

                    return (
                      <tr key={suggestion.id} className="border-b border-border hover:bg-background">
                        <td className="p-4 font-medium text-text-primary">{suggestion.target_keyword}</td>
                        <td className="p-4 text-text-secondary text-sm">{suggestion.template_type}</td>
                        <td className="p-4 text-text-secondary">
                          {ourRank ? `#${ourRank}` : 'N/A'}
                        </td>
                        <td className="p-4 text-text-secondary">
                          {compRank ? `#${compRank}` : 'N/A'}
                        </td>
                        <td className={`p-4 font-medium ${gapColor}`}>
                          {gap === null ? 'N/A' : gap > 0 ? `+${gap}` : gap}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(suggestion.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {suggestion.status === 'pending' && (
                              <Button onClick={() => handleGenerate(suggestion)} size="sm">
                                Generate
                              </Button>
                            )}
                            {suggestion.status === 'generated' && (
                              <>
                                <Button
                                  onClick={() => handleDownload(suggestion)}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <DownloadIcon className="h-3 w-3" />
                                  Download
                                </Button>
                                <Button
                                  onClick={() => handleMarkPublished(suggestion)}
                                  size="sm"
                                  variant="default"
                                >
                                  Mark Published
                                </Button>
                              </>
                            )}
                            {suggestion.status === 'published' && (
                              <span className="text-sm text-text-secondary">
                                {new Date(suggestion.published_at!).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside text-text-secondary space-y-2">
            <li>System auto-generates 5 content suggestions/week based on 3-factor keyword logic</li>
            <li>Click <strong>"Generate"</strong> → Triggers Claude Skill execution (truth_serum_v3_competitive.py)</li>
            <li>Download HTML/CSS ready for web team</li>
            <li>Mark <strong>"Published"</strong> when live on website → Start SERP tracking</li>
            <li>Track before/after rank changes to measure content impact</li>
          </ol>

          <div className="mt-6 p-4 bg-background rounded-md border border-border">
            <h4 className="font-semibold text-text-primary mb-2">3-Factor Keyword Targeting Logic:</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>1. <strong>Top Keyword Monetary Gain per Click</strong> (SPYFU CPC × Search Volume)</li>
              <li>2. <strong>Where client is losing rank vs competition</strong> (Rank gap analysis)</li>
              <li>3. <strong>Inventory/Service gaps that support #1 and #2</strong> (Content-inventory alignment)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
