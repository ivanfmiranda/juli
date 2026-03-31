export interface PageBlock {
  id: string;
  type: string;
  props: Record<string, any>;
}

export interface PageLayout {
  slug: string;
  title: string;
  tenantKey: string;
  layout: PageBlock[];
}
