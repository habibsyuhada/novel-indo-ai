import { GetServerSideProps } from 'next';

const Robots = () => {
  // This component doesn't need to render anything
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click';
  
  // Set the appropriate header
  res.setHeader('Content-Type', 'text/plain');
  
  // Generate robots.txt content
  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;

  // Send the robots.txt
  res.write(robots);
  res.end();

  return {
    props: {},
  };
};

export default Robots; 