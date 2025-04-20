package org.moodmealai.moodmealai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class GooglePlacesService {

    @Value("${google.places.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<PlaceDto> searchPlaces(String query, int limit) {
        String url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
                + "?key=" + apiKey
                + "&query=" + query
                + "&type=restaurant";

        String response = restTemplate.getForObject(url, String.class);
        List<PlaceDto> places = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.get("results");

            for (int i = 0; i < Math.min(limit, results.size()); i++) {
                JsonNode placeNode = results.get(i);
                String name = placeNode.has("name") ? placeNode.get("name").asText() : "Unnamed Place";
                String address = placeNode.has("formatted_address") ? placeNode.get("formatted_address").asText() : "No address available";

                // Build photo URL if available
                String photoUrl = null;
                if (placeNode.has("photos") && placeNode.get("photos").isArray() && placeNode.get("photos").size() > 0) {
                    String photoReference = placeNode.get("photos").get(0).get("photo_reference").asText();
                    photoUrl = "https://maps.googleapis.com/maps/api/place/photo"
                            + "?maxwidth=400"
                            + "&photo_reference=" + photoReference
                            + "&key=" + apiKey;
                }

                places.add(new PlaceDto(name, address, photoUrl));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return places;
    }
}