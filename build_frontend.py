"""Custom build script to build React frontend before packaging."""
import shutil
import subprocess
from pathlib import Path

from setuptools import build_meta as _orig
from setuptools.build_meta import *  # noqa: F401, F403


def build_frontend() -> None:
    """Build the React frontend for live_trace interceptor."""
    frontend_dir = Path("src/interceptors/live_trace/frontend")
    static_dir = Path("src/interceptors/live_trace/static")

    if not frontend_dir.exists():
        print("⚠️  Frontend directory not found, skipping frontend build")
        return

    print("🔨 Building live_trace frontend...")

    try:
        # Check if npm is available
        subprocess.run(["npm", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  npm not found, skipping frontend build")
        print("   Install Node.js to include the frontend in the package")
        return

    try:
        # Install dependencies
        print("   Installing npm dependencies...")
        subprocess.run(
            ["npm", "install"],
            cwd=frontend_dir,
            check=True,
            capture_output=True
        )

        # Build the React app
        print("   Building React app...")
        subprocess.run(
            ["npm", "run", "build"],
            cwd=frontend_dir,
            check=True,
            capture_output=True
        )

        # Move build output to static directory
        build_output = frontend_dir / "dist"
        if build_output.exists():
            print(f"   Copying build to {static_dir}/dist...")
            if static_dir.exists():
                shutil.rmtree(static_dir)
            shutil.copytree(build_output, static_dir / "dist")
            print("✅ Frontend build complete!")
        else:
            print("⚠️  Build output not found at expected location")

    except subprocess.CalledProcessError as e:
        # Print the actual error output for debugging
        if e.stdout:
            print(f"   stdout: {e.stdout.decode()}")
        if e.stderr:
            print(f"   stderr: {e.stderr.decode()}")
        raise RuntimeError(f"Frontend build failed: {e}") from e


def build_sdist(sdist_directory: str, config_settings: dict = None) -> str:
    """Build source distribution with frontend."""
    build_frontend()
    return _orig.build_sdist(sdist_directory, config_settings)


def build_wheel(wheel_directory: str, config_settings: dict = None, metadata_directory: str = None) -> str:
    """Build wheel distribution with frontend."""
    build_frontend()
    return _orig.build_wheel(wheel_directory, config_settings, metadata_directory)


def build_editable(wheel_directory: str, config_settings: dict = None, metadata_directory: str = None) -> str:
    """Build editable distribution with frontend."""
    build_frontend()
    return _orig.build_editable(wheel_directory, config_settings, metadata_directory)


def prepare_metadata_for_build_editable(metadata_directory: str, config_settings: dict = None) -> str:
    """Prepare metadata for editable install."""
    return _orig.prepare_metadata_for_build_editable(metadata_directory, config_settings)
