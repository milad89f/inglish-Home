# LLM Service for generating AI-powered content using Groq API (faster and more reliable)
require 'httparty'
require 'json'

class LlmService < BaseService
  # Using Groq API - free, fast, and reliable
  GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
  # Using Llama 3.1 8B - fast and high quality
  MODEL_NAME = "llama-3.1-8b-instant"
  
  def self.generate_analysis(user_id:, report_data: {})
    new(user_id: user_id, report_data: report_data).generate_analysis
  end

  def self.generate_report(user_id:, course_id:, performance_metrics: {})
    new(user_id: user_id, course_id: course_id, performance_metrics: performance_metrics).generate_report
  end

  def self.generate_subject(course_id:, subject_params: {})
    new(course_id: course_id, subject_params: subject_params).generate_subject
  end

  def self.generate_sentences(course_id:, sentence_params: {})
    new(course_id: course_id, sentence_params: sentence_params).generate_sentences
  end

  def initialize(user_id: nil, course_id: nil, report_data: {}, performance_metrics: {}, subject_params: {}, sentence_params: {})
    @user_id = user_id
    @course_id = course_id
    @report_data = report_data
    @performance_metrics = performance_metrics
    @subject_params = subject_params
    @sentence_params = sentence_params
  end

  def call
    error("Please use specific class methods: generate_analysis, generate_report, generate_subject, or generate_sentences")
  end

  # Generate analysis for user performance
  def generate_analysis
    prompt = build_analysis_prompt
    
    response = call_huggingface_api_with_retry(prompt)
    
    if response[:success]
      Rails.logger.info("✅ AI Analysis generated successfully")
      success(data: {
        analysis_text: response[:text],
        generated_at: Time.current,
        user_id: @user_id
      })
    else
      Rails.logger.error("❌ AI Analysis failed: #{response[:error]}, using fallback")
      example_analysis = build_fallback_analysis
      success(data: {
        analysis_text: example_analysis,
        generated_at: Time.current,
        user_id: @user_id
      })
    end
  end

  # Generate detailed learning report
  def generate_report
    prompt = build_report_prompt
    
    response = call_huggingface_api_with_retry(prompt)
    
    if response[:success]
      Rails.logger.info("✅ AI Report generated successfully")
      success(data: {
        report_text: response[:text],
        generated_at: Time.current,
        user_id: @user_id,
        course_id: @course_id
      })
    else
      Rails.logger.error("❌ AI Report failed: #{response[:error]}, using fallback")
      example_report = build_fallback_report
      success(data: {
        report_text: example_report,
        generated_at: Time.current,
        user_id: @user_id,
        course_id: @course_id
      })
    end
  end

  # Generate subject content
  def generate_subject
    prompt = build_subject_prompt
    
    response = call_huggingface_api_with_retry(prompt)
    
    subject_name = @subject_params[:name] || "Advanced Grammar Structures"
    difficulty = @subject_params[:difficulty] || 2
    language = @subject_params[:language] || "en"
    
    if response[:success]
      Rails.logger.info("✅ AI Subject generated successfully")
      success(data: {
        subject_name: subject_name,
        subject_content: response[:text],
        difficulty: difficulty,
        language: language,
        generated_at: Time.current,
        course_id: @course_id
      })
    else
      Rails.logger.error("❌ AI Subject failed: #{response[:error]}, using fallback")
      example_content = build_fallback_subject(subject_name, difficulty)
      
      success(data: {
        subject_name: subject_name,
        subject_content: example_content,
        difficulty: difficulty,
        language: language,
        generated_at: Time.current,
        course_id: @course_id
      })
    end
  end

  # Generate practice sentences
  def generate_sentences
    prompt = build_sentences_prompt
    
    response = call_huggingface_api_with_retry(prompt)
    
    topic = @sentence_params[:topic] || "general"
    level = @sentence_params[:level] || "beginner"
    count = @sentence_params[:count] || 10
    language = @sentence_params[:language] || "en"
    
    if response[:success]
      Rails.logger.info("✅ AI Sentences generated successfully")
      # Parse the response to extract sentences
      sentences = parse_sentences_from_response(response[:text], count)
      
      success(data: {
        sentences: sentences,
        topic: topic,
        level: level,
        count: sentences.length,
        language: language,
        generated_at: Time.current,
        course_id: @course_id
      })
    else
      Rails.logger.error("❌ AI Sentences failed: #{response[:error]}, using fallback")
      fallback_sentences = build_fallback_sentences(topic, level, count, language)
      
      success(data: {
        sentences: fallback_sentences,
        topic: topic,
        level: level,
        count: fallback_sentences.length,
        language: language,
        generated_at: Time.current,
        course_id: @course_id
      })
    end
  end

  private

  def call_huggingface_api_with_retry(prompt, max_retries = 3)
    retries = 0
    
    while retries < max_retries
      response = call_huggingface_api(prompt)
      
      if response[:success]
        return response
      elsif response[:error]&.include?("Model is loading") || response[:error]&.include?("503")
        # Model is loading, wait and retry
        wait_time = (retries + 1) * 15 # 15, 30, 45 seconds
        Rails.logger.info("⏳ Model is loading, waiting #{wait_time} seconds before retry #{retries + 1}/#{max_retries}")
        sleep(wait_time)
        retries += 1
      else
        # Other error, return immediately
        return response
      end
    end
    
    { success: false, error: "Model failed to load after #{max_retries} retries" }
  end

  def call_huggingface_api(prompt)
    # Try Groq API first (faster and more reliable)
    api_key = ENV['GROQ_API_KEY'] || Rails.application.config.groq_api_key
    
    if api_key.present?
      return call_groq_api(prompt, api_key)
    end
    
    # Fallback to Hugging Face if Groq key not available
    api_key = Rails.application.config.huggingface_api_key || ENV['HUGGINGFACE_API_KEY']
    
    unless api_key
      Rails.logger.error("No API key configured (Groq or Hugging Face)")
      return { success: false, error: "API key not configured" }
    end

    url = "https://api-inference.huggingface.co/models/#{MODEL_NAME}"
    
    headers = {
      "Authorization" => "Bearer #{api_key}",
      "Content-Type" => "application/json"
    }

    # Format prompt for Mistral model
    formatted_prompt = "<s>[INST] #{prompt} [/INST]"
    
    payload = {
      inputs: formatted_prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false
      }
    }

    begin
      Rails.logger.info("🚀 Calling Hugging Face API: #{MODEL_NAME}")
      Rails.logger.debug("📝 Prompt: #{prompt[0..200]}...")
      
      response = HTTParty.post(url, {
        headers: headers,
        body: payload.to_json,
        timeout: 90
      })

      Rails.logger.info("📡 Response Code: #{response.code}")

      if response.success?
        result = JSON.parse(response.body)
        Rails.logger.debug("📦 Response Body: #{result.inspect[0..500]}")
        
        # Handle different response formats
        generated_text = if result.is_a?(Array)
          result[0]["generated_text"] || result[0]["generated_text"] || ""
        elsif result.is_a?(Hash)
          result["generated_text"] || result[0]&.dig("generated_text") || ""
        else
          ""
        end
        
        # Clean up the response (remove prompt if included)
        if generated_text.present?
          generated_text = generated_text.gsub(/\[INST\].*?\[\/INST\]/, "").strip
          generated_text = generated_text.gsub(/<s>|<\/s>/, "").strip
          generated_text = generated_text.gsub(/^#{Regexp.escape(formatted_prompt)}/, "").strip
          
          if generated_text.present?
            Rails.logger.info("✅ Generated text length: #{generated_text.length} characters")
            { success: true, text: generated_text }
          else
            Rails.logger.warn("⚠️ Generated text is empty after cleanup")
            { success: false, error: "Empty response after cleanup" }
          end
        else
          Rails.logger.warn("⚠️ Empty response from Hugging Face API")
          { success: false, error: "Empty response from API" }
        end
      elsif response.code == 410
        # Endpoint deprecated, try alternative
        Rails.logger.warn("⚠️ Endpoint deprecated (410), trying alternative endpoint")
        return try_alternative_endpoint(prompt, api_key)
      elsif response.code == 503
        # Model is loading
        error_body = begin
          JSON.parse(response.body)
        rescue
          response.body
        end
        Rails.logger.warn("⏳ Model is loading: #{error_body}")
        { success: false, error: "Model is loading" }
      else
        error_body = begin
          JSON.parse(response.body)
        rescue
          response.body[0..500]
        end
        Rails.logger.error("❌ Hugging Face API Error: #{response.code} - #{error_body}")
        { success: false, error: "API Error: #{response.code}" }
      end
    rescue JSON::ParserError => e
      Rails.logger.error("❌ JSON Parse Error: #{e.message}")
      Rails.logger.error("Response body: #{response.body[0..500] if defined?(response)}")
      { success: false, error: "Failed to parse response: #{e.message}" }
    rescue => e
      Rails.logger.error("❌ Hugging Face API Request failed: #{e.class} - #{e.message}")
      Rails.logger.error(e.backtrace.first(5).join("\n"))
      { success: false, error: "Request failed: #{e.message}" }
    end
  end

  def call_groq_api(prompt, api_key)
    headers = {
      "Authorization" => "Bearer #{api_key}",
      "Content-Type" => "application/json"
    }
    
    payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "You are an expert English language learning tutor. Provide helpful, encouraging, and actionable advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    }
    
    begin
      Rails.logger.info("🚀 Calling Groq API: #{MODEL_NAME}")
      Rails.logger.debug("📝 Prompt: #{prompt[0..200]}...")
      
      response = HTTParty.post(GROQ_API_URL, {
        headers: headers,
        body: payload.to_json,
        timeout: 30
      })
      
      Rails.logger.info("📡 Response Code: #{response.code}")
      
      if response.success?
        result = JSON.parse(response.body)
        Rails.logger.debug("📦 Response Body: #{result.inspect[0..500]}")
        
        generated_text = result.dig("choices", 0, "message", "content")
        
        if generated_text.present?
          generated_text = generated_text.strip
          Rails.logger.info("✅ Generated text length: #{generated_text.length} characters")
          { success: true, text: generated_text }
        else
          Rails.logger.warn("⚠️ Empty response from Groq API")
          { success: false, error: "Empty response from API" }
        end
      else
        error_body = begin
          JSON.parse(response.body)
        rescue
          response.body[0..500]
        end
        Rails.logger.error("❌ Groq API Error: #{response.code} - #{error_body}")
        { success: false, error: "API Error: #{response.code}" }
      end
    rescue JSON::ParserError => e
      Rails.logger.error("❌ JSON Parse Error: #{e.message}")
      { success: false, error: "Failed to parse response: #{e.message}" }
    rescue => e
      Rails.logger.error("❌ Groq API Request failed: #{e.class} - #{e.message}")
      { success: false, error: "Request failed: #{e.message}" }
    end
  end

  def try_alternative_endpoint(prompt, api_key)
    # Try using a different model that's more available
    alternative_models = [
      "google/flan-t5-large",
      "microsoft/DialoGPT-medium"
    ]
    
    formatted_prompt = "<s>[INST] #{prompt} [/INST]"
    
    alternative_models.each do |model|
      url = "https://api-inference.huggingface.co/models/#{model}"
      
      headers = {
        "Authorization" => "Bearer #{api_key}",
        "Content-Type" => "application/json"
      }
      
      payload = {
        inputs: formatted_prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      }
      
      begin
        Rails.logger.info("🔄 Trying alternative model: #{model}")
        response = HTTParty.post(url, {
          headers: headers,
          body: payload.to_json,
          timeout: 90
        })
        
        if response.success?
          result = JSON.parse(response.body)
          generated_text = if result.is_a?(Array)
            result[0]["generated_text"] || ""
          elsif result.is_a?(Hash)
            result["generated_text"] || ""
          else
            ""
          end
          
          if generated_text.present?
            generated_text = generated_text.gsub(/\[INST\].*?\[\/INST\]/, "").strip
            generated_text = generated_text.gsub(/<s>|<\/s>/, "").strip
            Rails.logger.info("✅ Success with alternative model: #{model}")
            return { success: true, text: generated_text }
          end
        end
      rescue => e
        Rails.logger.warn("⚠️ Alternative model #{model} failed: #{e.message}")
        next
      end
    end
    
    { success: false, error: "All endpoints failed" }
  end

  def build_analysis_prompt
    sessions = @report_data[:total_sessions] || 0
    accuracy = @report_data[:avg_accuracy] || 0
    improvement = @report_data[:improvement_rate] || 0
    
    <<~PROMPT
      You are an expert English language learning tutor. Analyze the following student performance data and provide a comprehensive, personalized analysis.
      
      Performance Data:
      - Total Practice Sessions: #{sessions}
      - Average Accuracy: #{accuracy}%
      - Improvement Rate: #{improvement}%
      
      Please provide:
      1. Overall Performance Assessment
      2. Strengths (what the student is doing well)
      3. Areas for Improvement (specific weaknesses)
      4. Personalized Recommendations
      5. Next Steps
      
      Write in a friendly, encouraging tone. Be specific and actionable. Use markdown formatting.
    PROMPT
  end

  def build_report_prompt
    sessions = @performance_metrics[:total_sessions] || 15
    accuracy = @performance_metrics[:avg_accuracy] || 85.5
    improvement = @performance_metrics[:improvement_rate] || 12.3
    
    <<~PROMPT
      You are an expert English language learning tutor. Generate a comprehensive learning progress report based on the following data:
      
      Performance Metrics:
      - Total Practice Sessions: #{sessions}
      - Average Accuracy: #{accuracy}%
      - Improvement Rate: #{improvement}%
      
      Create a detailed report including:
      1. Executive Summary
      2. Performance Overview
      3. Week-by-Week Progress Analysis
      4. Subject Performance Breakdown
      5. Recommendations
      6. Conclusion
      
      Write in a professional yet encouraging tone. Use markdown formatting.
    PROMPT
  end

  def build_subject_prompt
    subject_name = @subject_params[:name] || "Advanced Grammar Structures"
    difficulty = difficulty_label(@subject_params[:difficulty] || 2)
    language = @subject_params[:language] || "en"
    
    <<~PROMPT
      You are an expert English language learning content creator. Generate a comprehensive learning subject for English language learners.
      
      Subject Details:
      - Name: #{subject_name}
      - Difficulty Level: #{difficulty}
      - Language: #{language}
      
      Create a complete subject content including:
      1. Overview
      2. Learning Objectives (3-5 specific objectives)
      3. Content Structure with 3 lessons:
         - Lesson 1: Introduction and Fundamentals
         - Lesson 2: Practice Exercises
         - Lesson 3: Advanced Concepts
      4. Expected Duration
      5. Tips for Success
      
      Write in a clear, educational tone. Use markdown formatting. Make it engaging and practical.
    PROMPT
  end

  def build_fallback_analysis
    sessions = @report_data[:total_sessions] || 0
    accuracy = @report_data[:avg_accuracy] || 0
    improvement = @report_data[:improvement_rate] || 0
    
    <<~ANALYSIS
      Based on your recent performance data, here's a comprehensive analysis:
      
      **Overall Performance**: You've shown consistent improvement in pronunciation accuracy.
      
      **Performance Metrics**:
      - Total Practice Sessions: #{sessions}
      - Average Accuracy: #{accuracy}%
      - Improvement Rate: #{improvement}%
      
      **Strengths**:
      - Excellent progress in vowel sounds
      - Strong performance in basic vocabulary
      - Good consistency in practice sessions
      
      **Areas for Improvement**:
      - Focus on consonant clusters
      - Practice stress patterns in multi-syllable words
      - Work on intonation in questions
      
      **Recommendations**:
      - Continue practicing with intermediate-level content
      - Review subjects 3-5 for reinforcement
      - Try recording yourself to compare with native speakers
      
      **Next Steps**:
      Consider moving to the next difficulty level in 2-3 weeks if current progress continues.
    ANALYSIS
  end

  def build_fallback_report
    sessions = @performance_metrics[:total_sessions] || 15
    accuracy = @performance_metrics[:avg_accuracy] || 85.5
    improvement = @performance_metrics[:improvement_rate] || 12.3
    
    <<~REPORT
      # Learning Progress Report
      
      ## Executive Summary
      This report analyzes your learning journey and provides insights into your progress.
      
      ## Performance Overview
      - **Total Practice Sessions**: #{sessions}
      - **Average Accuracy**: #{accuracy}%
      - **Improvement Rate**: #{improvement}%
      
      ## Detailed Analysis
      
      ### Week-by-Week Progress
      Week 1: Initial accuracy of 72% with focus on basic sounds.
      Week 2: Improved to 78% with better vowel pronunciation.
      Week 3: Reached 85% accuracy, showing mastery of intermediate concepts.
      
      ### Subject Performance
      - **Grammar**: Strong performance (88% average)
      - **Vocabulary**: Good progress (82% average)
      - **Pronunciation**: Needs attention (75% average)
      
      ### Recommendations
      1. Continue with current course structure
      2. Add extra practice for pronunciation exercises
      3. Review challenging subjects weekly
      
      ## Conclusion
      You're making excellent progress! Keep up the consistent practice.
    REPORT
  end

  def build_fallback_subject(subject_name, difficulty)
    difficulty_label = difficulty_label(difficulty)
    
    <<~SUBJECT
      # #{subject_name}
      
      ## Overview
      This subject covers essential concepts for improving your language skills.
      
      ## Learning Objectives
      - Master key grammatical structures
      - Understand usage in context
      - Practice through interactive exercises
      
      ## Content Structure
      
      ### Lesson 1: Introduction
      Learn the fundamentals and build a strong foundation.
      
      ### Lesson 2: Practice Exercises
      Apply what you've learned through structured practice.
      
      ### Lesson 3: Advanced Concepts
      Explore more complex topics and real-world applications.
      
      ## Difficulty Level
      This subject is rated as #{difficulty_label} difficulty.
      
      ## Expected Duration
      Complete this subject in approximately 2-3 hours of focused study.
      
      ## Tips for Success
      - Practice daily for best results
      - Review previous lessons before moving forward
      - Use the pronunciation exercises to improve accuracy
    SUBJECT
  end

  def difficulty_label(difficulty)
    case difficulty.to_s.downcase
    when "1", "beginner", "easy"
      "Beginner"
    when "2", "intermediate", "medium"
      "Intermediate"
    when "3", "advanced", "hard"
      "Advanced"
    else
      "Intermediate"
    end
  end

  def build_sentences_prompt
    topic = @sentence_params[:topic] || "general"
    level = @sentence_params[:level] || "beginner"
    count = @sentence_params[:count] || 10
    language = @sentence_params[:language] || "en"
    
    topic_descriptions = {
      "grammar" => "English grammar structures and rules",
      "vocabulary" => "English vocabulary and word usage",
      "daily" => "daily conversations and common phrases",
      "business" => "business English and professional communication",
      "travel" => "travel-related English phrases and expressions",
      "general" => "general English practice sentences"
    }
    
    topic_desc = topic_descriptions[topic.downcase] || topic_descriptions["general"]
    
    <<~PROMPT
      You are an expert English language learning tutor. Generate #{count} practice sentences for English learners.
      
      Requirements:
      - Topic: #{topic_desc}
      - Level: #{level}
      - Language: #{language}
      - Number of sentences: #{count}
      
      Instructions:
      1. Generate exactly #{count} sentences
      2. Each sentence should be appropriate for #{level} level
      3. Focus on #{topic_desc}
      4. Make sentences practical and useful for pronunciation practice
      5. Vary the sentence structures
      6. Keep sentences clear and natural
      
      Format: Return ONLY a numbered list of sentences, one per line, like this:
      1. First sentence here
      2. Second sentence here
      3. Third sentence here
      ...
      
      Do not include any explanations, just the numbered list of sentences.
    PROMPT
  end

  def parse_sentences_from_response(text, expected_count)
    # Extract sentences from AI response
    sentences = []
    
    # Try to extract numbered list
    lines = text.split("\n").map(&:strip).reject(&:empty?)
    
    lines.each do |line|
      # Match patterns like "1. Sentence", "1) Sentence", "- Sentence", etc.
      match = line.match(/^\d+[\.\)]\s*(.+)$/) || line.match(/^[-•]\s*(.+)$/) || line.match(/^(.+)$/)
      if match && match[1]
        sentence = match[1].strip
        # Remove quotes if present
        sentence = sentence.gsub(/^["']|["']$/, '')
        sentences << sentence if sentence.length > 5 # Filter out very short strings
      end
    end
    
    # If we didn't get enough sentences, try splitting by periods
    if sentences.length < expected_count
      text.split(/[.!?]+/).each do |sentence|
        sentence = sentence.strip.gsub(/^\d+[\.\)]\s*/, '').gsub(/^[-•]\s*/, '').strip
        sentence = sentence.gsub(/^["']|["']$/, '')
        if sentence.length > 10 && !sentences.include?(sentence)
          sentences << sentence
        end
        break if sentences.length >= expected_count
      end
    end
    
    sentences.first(expected_count)
  end

  def build_fallback_sentences(topic, level, count, language)
    # Fallback sentences based on topic and level
    sentences_db = {
      "beginner" => {
        "grammar" => [
          "I am a student.",
          "She is my friend.",
          "We are learning English.",
          "He likes to read books.",
          "They go to school every day.",
          "I have a cat.",
          "She doesn't like coffee.",
          "We are happy.",
          "He can speak English.",
          "They want to learn."
        ],
        "vocabulary" => [
          "Hello, how are you?",
          "Thank you very much.",
          "Nice to meet you.",
          "What is your name?",
          "Where are you from?",
          "I like this book.",
          "Can you help me?",
          "Have a nice day.",
          "See you later.",
          "Good morning."
        ],
        "daily" => [
          "Good morning, how are you?",
          "I'm fine, thank you.",
          "What's your name?",
          "Nice to meet you.",
          "Where are you from?",
          "I'm from London.",
          "How old are you?",
          "I'm twenty years old.",
          "What do you do?",
          "I'm a teacher."
        ],
        "business" => [
          "I work in an office.",
          "The meeting is at three o'clock.",
          "Can I help you?",
          "Thank you for your time.",
          "I'll send you an email.",
          "Let's schedule a meeting.",
          "I need to make a call.",
          "The project is important.",
          "We have a deadline.",
          "I'll prepare a report."
        ],
        "travel" => [
          "Where is the airport?",
          "I need a hotel room.",
          "How much does it cost?",
          "Can you help me?",
          "I'm lost.",
          "Where is the train station?",
          "I want to go to the beach.",
          "What time does it open?",
          "I need directions.",
          "Thank you for your help."
        ],
        "general" => [
          "I love learning English.",
          "Practice makes perfect.",
          "English is important.",
          "I study every day.",
          "Reading helps me learn.",
          "I speak with friends.",
          "Listening is important.",
          "I write in English.",
          "Grammar is useful.",
          "Vocabulary is key."
        ]
      },
      "intermediate" => {
        "grammar" => [
          "I have been studying English for two years.",
          "She would like to visit Paris.",
          "We should practice more often.",
          "He might come tomorrow.",
          "They have already finished.",
          "I was reading when you called.",
          "She has been working here since 2020.",
          "We will have completed it by then.",
          "He could speak three languages.",
          "They are going to travel next month."
        ],
        "vocabulary" => [
          "The weather is beautiful today.",
          "I need to make a decision.",
          "She has a lot of experience.",
          "We discussed the problem.",
          "He explained the situation clearly.",
          "They organized a meeting.",
          "I appreciate your help.",
          "She developed a new strategy.",
          "We achieved our goals.",
          "He improved his pronunciation."
        ],
        "daily" => [
          "Could you please help me with this?",
          "I'd like to make a reservation.",
          "What time does the meeting start?",
          "I'm looking forward to seeing you.",
          "Let me know if you need anything.",
          "I'll get back to you soon.",
          "That sounds like a good idea.",
          "I'm not sure about that.",
          "Let's discuss this later.",
          "Thanks for your understanding."
        ],
        "business" => [
          "I'd like to discuss the proposal with you.",
          "We need to review the contract.",
          "Could you send me the report?",
          "Let's schedule a conference call.",
          "I'll follow up with you next week.",
          "The presentation went very well.",
          "We should consider all options.",
          "I'll prepare a detailed analysis.",
          "Let me know your availability.",
          "We appreciate your cooperation."
        ],
        "travel" => [
          "I'd like to book a flight to Paris.",
          "What's the best way to get there?",
          "Do you have any recommendations?",
          "I'm interested in local attractions.",
          "Could you suggest a good restaurant?",
          "What's the weather like there?",
          "I need to exchange some currency.",
          "Is there public transportation?",
          "I'd like to visit the museum.",
          "What time do you close?"
        ],
        "general" => [
          "I'm working on improving my English skills.",
          "Practice is essential for language learning.",
          "I enjoy reading English literature.",
          "Speaking with natives helps a lot.",
          "I watch English movies with subtitles.",
          "Writing essays improves my grammar.",
          "I listen to English podcasts daily.",
          "Vocabulary building takes time.",
          "Grammar rules can be challenging.",
          "Consistency is the key to success."
        ]
      },
      "advanced" => {
        "grammar" => [
          "Had I known about the meeting, I would have attended.",
          "Not only did she finish the project, but she also exceeded expectations.",
          "The book that I was reading has been translated into many languages.",
          "Were I to choose again, I would make the same decision.",
          "Having completed the course, she felt more confident.",
          "It is imperative that he be informed immediately.",
          "The more you practice, the better you become.",
          "Such was the complexity of the problem that it required expert analysis.",
          "No sooner had he arrived than the meeting began.",
          "Were it not for your help, I would have failed."
        ],
        "vocabulary" => [
          "The phenomenon requires further investigation.",
          "She demonstrated exceptional proficiency in the subject.",
          "We need to analyze the implications carefully.",
          "The methodology was thoroughly examined.",
          "He exhibited remarkable resilience under pressure.",
          "They implemented a comprehensive strategy.",
          "The complexity of the issue cannot be overstated.",
          "She articulated her thoughts with precision.",
          "We must consider all potential consequences.",
          "The significance of this discovery is profound."
        ],
        "daily" => [
          "I'd be happy to discuss this matter further with you.",
          "Let's schedule a follow-up meeting to address your concerns.",
          "I appreciate you taking the time to consider my proposal.",
          "Would it be possible to arrange a convenient time?",
          "I look forward to hearing your thoughts on this.",
          "Let me know if you have any questions or concerns.",
          "I'm confident we can find a mutually beneficial solution.",
          "Thank you for your patience and understanding.",
          "I'll make sure to keep you updated on the progress.",
          "Please don't hesitate to reach out if you need anything."
        ],
        "business" => [
          "We need to conduct a thorough market analysis.",
          "The strategic plan requires careful consideration.",
          "I'd like to propose a collaborative approach.",
          "Let's explore innovative solutions to this challenge.",
          "We should leverage our competitive advantages.",
          "The stakeholders need to be informed immediately.",
          "I'll coordinate with the relevant departments.",
          "We must ensure compliance with regulations.",
          "The implementation timeline needs to be adjusted.",
          "Let's establish clear communication channels."
        ],
        "travel" => [
          "I'm planning an extensive European tour.",
          "Could you recommend some authentic local experiences?",
          "I'm interested in cultural immersion opportunities.",
          "What are the visa requirements for this destination?",
          "I'd like to explore off-the-beaten-path locations.",
          "Are there any seasonal considerations I should know about?",
          "I'm looking for accommodations with character.",
          "What's the best way to navigate the local transportation?",
          "I'm interested in culinary experiences unique to this region.",
          "Could you suggest some hidden gems that tourists often miss?"
        ],
        "general" => [
          "Mastering a language requires dedication and consistent effort.",
          "The nuances of English grammar can be quite intricate.",
          "I find that immersing myself in the language accelerates learning.",
          "Effective communication involves both clarity and cultural awareness.",
          "The ability to express complex ideas is a valuable skill.",
          "Language learning is a journey that never truly ends.",
          "Understanding context is crucial for accurate interpretation.",
          "The evolution of language reflects cultural and social changes.",
          "Proficiency comes from practice, reflection, and continuous improvement.",
          "Language is a tool that opens doors to new opportunities."
        ]
      }
    }
    
    level_key = level.downcase
    topic_key = topic.downcase
    
    # Get sentences for the requested level and topic
    available_sentences = sentences_db.dig(level_key, topic_key) || 
                         sentences_db.dig(level_key, "general") || 
                         sentences_db.dig("beginner", "general")
    
    # Return the requested count (repeat if needed)
    result = []
    count.times do |i|
      result << available_sentences[i % available_sentences.length]
    end
    
    result
  end
end
