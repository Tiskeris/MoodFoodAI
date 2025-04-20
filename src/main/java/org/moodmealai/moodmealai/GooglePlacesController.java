package org.moodmealai.moodmealai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
@RequestMapping("/places")
public class GooglePlacesController {

    @Autowired
    private GooglePlacesService googlePlacesService;

    @GetMapping("/search")
    public List<PlaceDto> searchPlaces(@RequestParam String query,
                                       @RequestParam(defaultValue = "5") int limit) {
        return googlePlacesService.searchPlaces(query, limit);
    }
    @GetMapping("/photo")
    public ResponseEntity<byte[]> getPhoto(@RequestParam String photoReference) {
        String url = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="
                + photoReference + "&key=YOUR_API_KEY";

        try {
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(response.getHeaders().getContentType());
            return new ResponseEntity<>(response.getBody(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

}