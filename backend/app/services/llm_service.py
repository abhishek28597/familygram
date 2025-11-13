# LLM Service for Groq Integration
from typing import List, Dict
from groq import Groq


class GroqLLMService:
    def __init__(self, api_key: str):
        """
        Initialize Groq client with API key
        
        Args:
            api_key: Groq API key
        """
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"
        self.fallback_model = "llama-3.1-8b-instant"
    
    def _make_api_call(self, messages: List[Dict], temperature: float, max_tokens: int):
        """
        Make API call with automatic fallback on any error
        
        Args:
            messages: List of message dictionaries
            temperature: Temperature setting
            max_tokens: Maximum tokens
            
        Returns:
            Response from the API
            
        Raises:
            Exception: If both primary and fallback models fail
        """
        try:
            return self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=temperature,
                max_tokens=max_tokens
            )
        except Exception:
            # Try fallback model on any error
            return self.client.chat.completions.create(
                messages=messages,
                model=self.fallback_model,
                temperature=temperature,
                max_tokens=max_tokens
            )
    
    def generate_family_summary(self, posts: List[Dict], users: List[Dict]) -> str:
        """
        Generate a daily summary of all family posts
        
        Args:
            posts: List of post dictionaries with content, user info, etc.
            users: List of all family members
            
        Returns:
            Summary string
        """
        if not posts:
            return "No posts were shared by the family today."
        
        # Format posts for LLM
        posts_text = "\n".join([
            f"- {post.get('user', {}).get('username', 'Unknown')}: {post.get('content', '')[:200]}"
            for post in posts[:50]  # Limit to 50 posts for context
        ])
        
        prompt = f"""You are a helpful family assistant. Summarize the family's activity today in a warm, engaging way.

Family Members: {', '.join([u.get('username', '') for u in users])}

Today's Posts:
{posts_text}

Create a brief, friendly summary (2-3 sentences) highlighting:
1. Overall family mood and activity
2. Key topics or themes
3. Any notable moments or updates

Keep it positive and family-friendly."""

        try:
            response = self._make_api_call(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=300
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating summary: {str(e)}"
    
    def generate_user_summary(self, user_posts: List[Dict], messages: List[Dict] = None) -> Dict:
        """
        Generate summary and sentiment for a specific user's daily activity
        
        Args:
            user_posts: List of user's posts for the day
            messages: Optional list of messages between current user and this user
            
        Returns:
            Dictionary with summary and sentiment (as free text)
        """
        if not user_posts and not messages:
            return {
                "post_summary": "No activity today.",
                "sentiment": "No posts or messages to analyze today."
            }
        
        # Format posts
        posts_text = ""
        if user_posts:
            posts_text = "\n".join([
                f"- {post.get('content', '')[:200]}"
                for post in user_posts
            ])
        
        # Format messages
        messages_text = ""
        if messages:
            messages_text = "\n".join([
                f"- {msg.get('content', '')[:150]}"
                for msg in messages[:20]  # Limit messages
            ])
        
        prompt = f"""Analyze this person's activity today and provide:
1. A brief summary of their posts (2-3 sentences)
2. Their overall sentiment/mood for the day as free-flowing descriptive text (not a score, but a natural description of how they seem to be feeling)

Today's Posts:
{posts_text}

Recent Messages:
{messages_text}

Respond in this format:
POST_SUMMARY: [summary text here]
SENTIMENT: [free-flowing description of their mood and emotional state today - be descriptive and natural, like "seems happy and energetic" or "appears thoughtful and reflective"]

Keep the sentiment description warm, empathetic, and family-friendly."""

        try:
            response = self._make_api_call(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=400
            )
            
            content = response.choices[0].message.content
            
            # Parse response
            return self._parse_user_response(content, user_posts)
            
        except Exception as e:
            return {
                "post_summary": f"Error analyzing: {str(e)}",
                "sentiment": "Unable to analyze sentiment at this time."
            }
    
    def _parse_user_response(self, content: str, posts: List[Dict]) -> Dict:
        """
        Parse LLM response and extract summary and sentiment
        """
        # Try to extract POST_SUMMARY and SENTIMENT sections
        post_summary = ""
        sentiment = ""
        
        # Look for POST_SUMMARY: pattern
        if "POST_SUMMARY:" in content:
            parts = content.split("POST_SUMMARY:")
            if len(parts) > 1:
                remaining = parts[1]
                if "SENTIMENT:" in remaining:
                    post_summary = remaining.split("SENTIMENT:")[0].strip()
                    sentiment = remaining.split("SENTIMENT:")[1].strip()
                else:
                    post_summary = remaining.strip()
        elif "SENTIMENT:" in content:
            # If only SENTIMENT is found
            parts = content.split("SENTIMENT:")
            if len(parts) > 0:
                post_summary = parts[0].replace("POST_SUMMARY:", "").strip()
            if len(parts) > 1:
                sentiment = parts[1].strip()
        else:
            # Fallback: try to split by newlines or use first part as summary
            lines = content.split('\n')
            post_summary = lines[0] if lines else "Unable to generate summary."
            sentiment = " ".join(lines[1:]) if len(lines) > 1 else "Unable to analyze sentiment."
        
        # If still empty, generate simple fallback
        if not post_summary:
            post_count = len(posts)
            if post_count == 0:
                post_summary = "No posts shared today."
            elif post_count == 1:
                post_summary = f"Shared 1 post today: {posts[0].get('content', '')[:100]}..."
            else:
                post_summary = f"Shared {post_count} posts today covering various topics."
        
        if not sentiment:
            sentiment = "Unable to determine sentiment from available content."
        
        return {
            "post_summary": post_summary,
            "sentiment": sentiment
        }

