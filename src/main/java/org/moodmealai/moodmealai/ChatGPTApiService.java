package org.moodmealai.moodmealai;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ChatGPTApiService {

    @Value("${openrouter.api.url}")
    private String API_URL;

    @Value("${openrouter.api.token}")
    private String API_TOKEN;

    private final OkHttpClient client = new OkHttpClient();

    public String getResponse(String userText) throws Exception {
        String prompt = buildPrompt(userText);

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
            if (!response.isSuccessful())
                throw new Exception("Unexpected code " + response);

            String responseBody = response.body().string();
            JSONObject responseJson = new JSONObject(responseBody);
            JSONArray choices = responseJson.getJSONArray("choices");
            String content = choices.getJSONObject(0).getJSONObject("message").getString("content");

            return content;
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
}
