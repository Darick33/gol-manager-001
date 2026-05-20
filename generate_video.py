import time
import os
from google import genai
from google.genai import types

os.environ["GOOGLE_API_KEY"] = "AIzaSyChUJJQ1cHzrp8jxG2Mk9F6E2w4pflS4eo"

client = genai.Client()

FIRST_FRAME = r"C:\Users\Sebas\OneDrive - UNIANDES\Documentos\abogados\abo1.jpg"
LAST_FRAME  = r"C:\Users\Sebas\OneDrive - UNIANDES\Documentos\abogados\abo3.jpg"

def load_image(path: str) -> types.Image:
    with open(path, "rb") as f:
        data = f.read()
    return types.Image(image_bytes=data, mime_type="image/jpeg")

first_image = load_image(FIRST_FRAME)
last_image  = load_image(LAST_FRAME)

prompt = """A marble classical statue of Lady Justice, starting as a dramatic close-up bust portrait — blindfolded face tilted upward, serene and stoic expression, white marble against deep black background — slowly pulls back in a smooth cinematic camera movement, gradually revealing her full figure: right arm raised high holding golden ornate scales of justice in perfect balance, left hand lowering a gleaming golden sword pointing downward, elegant draped robes with an ornate belt, standing on a carved stone base. The transition is fluid and majestic, the camera moves seamlessly from tight bust to full body reveal. Lighting remains dramatic, high-contrast studio light, deep black background throughout. Slow motion, 4–6 seconds, photorealistic marble texture, gold metallic accents on the scales and sword catch the light as they come into frame. Regal, authoritative, timeless."""

print("Submitting video generation request...")

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    image=first_image,
    config=types.GenerateVideosConfig(
        last_frame=last_image,
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
video.video.save("soccer_scene_build.mp4")
print("Saved to soccer_scene_build.mp4")



