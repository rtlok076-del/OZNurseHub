import { useParams, Link } from 'react-router-dom';
import { stories } from '../data/stories';

export default function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const story = stories.find((s) => s.slug === slug);

  if (!story) {
    return (
      <div className="story-page">
        <Link to="/" className="story-page__back">
          ← All Stories
        </Link>
        <p>Story not found.</p>
      </div>
    );
  }

  return (
    <div className="story-page">
      <Link to="/" className="story-page__back">
        ← All Stories
      </Link>

      <header className="story-page__header">
        <div className="story-page__meta">
          <span className="story-tag">{story.category}</span>
          <span className="story-read-time">{story.readTime} min read</span>
        </div>
        <h1 className="story-page__title">{story.title}</h1>
      </header>

      <section className="story-section story-body">
        <h2 className="story-section__heading">The Story</h2>
        {story.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>

      <section className="story-section">
        <h2 className="story-section__heading">What It Represents</h2>
        <p>{story.whatItRepresents}</p>
      </section>

      <section className="story-section">
        <h2 className="story-section__heading">Why It&apos;s Important</h2>
        <p>{story.whyItsImportant}</p>
      </section>

      <section className="story-section">
        <h2 className="story-section__heading">Key Takeaways</h2>
        <ul className="takeaways-list">
          {story.keyTakeaways.map((takeaway, i) => (
            <li key={i}>{takeaway}</li>
          ))}
        </ul>
      </section>

      <div className="reflection-section">
        <span className="reflection-section__label">Reflection Question</span>
        <p className="reflection-question">{story.reflectionQuestion}</p>
      </div>

      <div className="story-page__footer-nav">
        <Link to="/" className="story-page__back">
          ← Back to all stories
        </Link>
      </div>
    </div>
  );
}
