import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESKTOP = r"C:\Users\LAPTOP INSIDE\Desktop"
OUT = os.path.join(DESKTOP, "RAES-TECH-website-updated.zip")

SKIP_DIRS = {"node_modules", "dist", ".git", ".vite", "__pycache__", ".cache"}


def main():
    if os.path.exists(OUT):
        os.remove(OUT)
    count = 0
    total_bytes = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(ROOT):
            rel = os.path.relpath(root, ROOT)
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for f in files:
                if f.endswith((".pyc", ".log")):
                    continue
                fp = os.path.join(root, f)
                arc = os.path.join("RAES-TECH-website", rel, f) if rel != "." else os.path.join("RAES-TECH-website", f)
                z.write(fp, arc)
                count += 1
                total_bytes += os.path.getsize(fp)
    print("WROTE", OUT)
    print("FILES", count)
    print("SIZE_KB", round(total_bytes / 1024, 1))


if __name__ == "__main__":
    main()
