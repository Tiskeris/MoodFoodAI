package org.moodmealai.moodmealai;

import org.moodmealai.moodmealai.ChatGPTApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatGPTApiService chatGPTApiService;

    @PostMapping("/response")
    public String getChatResponse(@RequestBody String userText) {
        try {
            return chatGPTApiService.getResponse(userText);
        } catch (Exception e) {
            e.printStackTrace();
            return "Error occurred: " + e.getMessage();
        }
    }

    @PostMapping("/food-suggestions")
    public String getFoodSuggestions(@RequestParam String emotion, @RequestParam String initialFoods) {
        try {
            return chatGPTApiService.getFoodSuggestions(emotion, initialFoods);
        } catch (Exception e) {
            e.printStackTrace();
            return "Error occurred: " + e.getMessage();
        }
    }
}
