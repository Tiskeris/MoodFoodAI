package org.moodmealai.moodmealai;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.logging.Logger;

@Service
public class ChatGPTApiService {
    private static final Logger logger = Logger.getLogger(ChatGPTApiService.class.getName());

    @Value("${openrouter.api.url}")
    private String API_URL;

    @Value("${openrouter.api.token}")
    private String API_TOKEN;

    private final OkHttpClient client = new OkHttpClient();

    public String getResponse(String userText) throws Exception {
        String prompt = buildPrompt(userText);
        return makeApiRequest(prompt);
    }

    public String getFoodSuggestions(String emotion, String initialFoods) throws Exception {
        String prompt = buildFoodPrompt(emotion, initialFoods);
        return makeApiRequest(prompt);
    }

    private String makeApiRequest(String prompt) throws Exception {
        JSONObject requestBodyJson = new JSONObject();
        requestBodyJson.put("model", "deepseek/deepseek-r1:free");

        JSONArray messages = new JSONArray();
        JSONObject userMessage = new JSONObject();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.put(userMessage);

        requestBodyJson.put("messages", messages);

        MediaType mediaType = MediaType.parse("application/json");
        RequestBody body = RequestBody.create(requestBodyJson.toString(), mediaType);

        Request request = new Request.Builder()
                .url(API_URL)
                .post(body)
                .addHeader("Authorization", "Bearer " + API_TOKEN.trim())
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                logger.severe("API request failed with code: " + response.code() + ", response: " + responseBody);
                throw new Exception("API request failed with code: " + response.code());
            }

            logger.info("API Response: " + responseBody);

            try {
                JSONObject responseJson = new JSONObject(responseBody);

                // Check for error in response
                if (responseJson.has("error")) {
                    JSONObject errorObj = responseJson.optJSONObject("error");
                    String errorMessage = errorObj != null ?
                            errorObj.optString("message", "Unknown error") :
                            responseJson.optString("error", "Unknown error");
                    throw new Exception("API Error: " + errorMessage);
                }

                // Process successful response
                if (responseJson.has("choices")) {
                    JSONArray choices = responseJson.getJSONArray("choices");
                    if (choices.length() > 0) {
                        JSONObject firstChoice = choices.getJSONObject(0);
                        if (firstChoice.has("message")) {
                            return firstChoice.getJSONObject("message").getString("content");
                        } else {
                            throw new Exception("Message object not found in API response");
                        }
                    } else {
                        throw new Exception("Empty choices array in API response");
                    }
                } else {
                    // Handle OpenRouter-specific response format
                    if (responseJson.has("output") && responseJson.has("results")) {
                        // Some APIs might return results in a different format
                        return responseJson.getString("output");
                    }

                    // Fall back to returning the entire response if we can't parse it
                    logger.warning("Unexpected response format. Missing 'choices' array. Returning full response.");
                    return "Error processing response. Please check logs for details.";
                }
            } catch (JSONException e) {
                logger.severe("JSON parsing error: " + e.getMessage() + ", response: " + responseBody);
                throw new Exception("Failed to parse API response: " + e.getMessage());
            }
        } catch (IOException e) {
            logger.severe("Network error: " + e.getMessage());
            throw new Exception("Network error while calling API: " + e.getMessage());
        }
    }

    private String buildPrompt(String userText) {
        return """
            The user has provided the following preferences for restaurants and food:

            """ + userText + """

            Based on this, generate a single, well-optimized text search query string suitable for use with the Google Places API to find relevant restaurants. 
            The query should reflect the user's preferences, likes, dislikes, dietary restrictions, price range, and desired atmosphere. 
            Focus on keywords and phrases that would improve the accuracy of the search.

            Return only the search query string — no extra text, no formatting, no JSON, no "near me".
            """;
    }

    private String buildFoodPrompt(String emotion, String initialFoods) {
        return """
        The user is feeling

        """ + emotion + """

        Based on this emotion, suggest a food item that aligns with the user's preferences.
        The user has already mentioned the following foods:

        """ + initialFoods + """

        Focus on the initial foods provided and suggest a dish that closely matches them.
        Return only one food item wiht two words — no extra text, no formatting, no JSON.
        """;
    }
}