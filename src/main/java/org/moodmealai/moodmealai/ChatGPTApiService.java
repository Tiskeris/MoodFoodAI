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
        return "The user has provided the following preferences for restaurants and food:\n\n" +
                "\"" + userText + "\"\n\n" +
                "Please generate a valid JSON object based on this information with this structure:\n\n" +
                "{\n" +
                "  \"likes\": [\"list of liked foods, cuisines, or restaurants\"],\n" +
                "  \"dislikes\": [\"list of disliked foods, cuisines, or restaurants\"],\n" +
                "  \"dietaryRestrictions\": [\"list of dietary restrictions the user follows\"],\n" +
                "  \"pricePreference\": \"budget, mid-range, or high-end\",\n" +
                "  \"atmospherePreferences\": [\"list of atmosphere preferences like quiet, lively, outdoor seating, etc.\"],\n" +
                "  \"otherNotes\": \"any other relevant information\"\n" +
                "}\n\n" +
                "Return only the JSON — no extra text.";
    }
}
