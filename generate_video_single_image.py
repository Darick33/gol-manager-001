import time
import os
from google import genai
from google.genai import types

os.environ["GOOGLE_API_KEY"] = "AIzaSyChUJJQ1cHzrp8jxG2Mk9F6E2w4pflS4eo"

client = genai.Client()

FIRST_FRAME = r"C:\Users\Sebas\Downloads\Generated Image May 15, 2026 - 12_04AM.jpg"

def load_image(path: str) -> types.Image:
    with open(path, "rb") as f:
        data = f.read()
    return types.Image(image_bytes=data, mime_type="image/jpeg")

first_image = load_image(FIRST_FRAME)

prompt = """A classic white soccer ball centered on a solid black background slowly morphs and transforms into the iconic Ballon d'Or trophy by France Football, golden spherical award on a black base. No shine, no reflections, no shadows, flat matte lighting throughout. The camera then slowly pans to the right revealing Lionel Messi standing holding the Ballon d'Or trophy — Messi is entirely in black and white monochrome while the Ballon d'Or trophy remains in full golden color. Then the camera slowly pans to the left revealing Cristiano Ronaldo standing holding the Ballon d'Or trophy — Ronaldo is entirely in black and white monochrome while the Ballon d'Or remains in full golden color. Then the camera slowly pans to the right revealing Aitana Bonmatí standing holding the Ballon d'Or trophy — Bonmatí is entirely in black and white monochrome while the Ballon d'Or remains in full golden color. Finally the Ballon d'Or morphs back into the original classic white soccer ball. All transitions are extremely slow, smooth, and fluid. No glare, no lens flare, no dramatic lighting, no shadows. Solid black background throughout. Cinematic, elegant, minimalist."""

print("Submitting video generation request...")

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    image=first_image,
    config=types.GenerateVideosConfig(
        aspect_ratio="16:9",
        number_of_videos=1,
    ),
)

print(f"Operation started: {operation.name}")

while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

print("Video generation complete!")

video = operation.response.generated_videos[0]
client.files.download(file=video.video)
video.video.save("ballon_dor_sequence.mp4")
print("Saved to ballon_dor_sequence.mp4")
