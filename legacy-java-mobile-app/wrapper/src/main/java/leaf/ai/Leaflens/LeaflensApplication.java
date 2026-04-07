package leaf.ai.Leaflens;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class LeaflensApplication {

	public static void main(String[] args) {
		SpringApplication.run(LeaflensApplication.class, args);
	}

	@Bean
	public ChatClient.Builder chatClientBuilder(OpenAiChatModel openAiChatModel) {
		return ChatClient.builder(openAiChatModel);
	}
}
