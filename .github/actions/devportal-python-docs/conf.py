import os
import sys
from pathlib import Path

# --- DYNAMIC PATH SETUP ---
# USER_SRC should be passed from the action.yml as the repo root
user_src_root = Path(os.environ.get('USER_SRC', Path(__file__).parents[3]))
sys.path.insert(0, str(user_src_root / "src"))

# -- Project information -----------------------------------------------------
project = "Algokit Subscriber"
copyright = "2024, Algorand Foundation"
author = "Algorand Foundation"

# -- General configuration ---------------------------------------------------
extensions = [
    "sphinx.ext.githubpages",
    "sphinx.ext.intersphinx",
    "sphinx_copybutton",
    "myst_parser",
    "autodoc2",
    "sphinx.ext.doctest",
    "sphinxmermaid",
]

# Adjust paths to look inside the Action folder for templates/static
# This assumes _templates and _static are inside the same action folder as conf.py
action_path = Path(__file__).parent
templates_path = [str(action_path / "_templates")]
html_static_path = [str(action_path / "_static")]

exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# -- Options for autodoc2 ----------------------------------------------------
autodoc2_packages = [
    {
        # Dynamically point to the user's source code
        "path": str(user_src_root / "src" / "algokit_subscriber"),
        "auto_mode": True,
    },
]
autodoc2_render_plugin = "myst"
autodoc2_hidden_objects = ["private"]
add_module_names = False
autodoc2_index_template = None

# -- Options for HTML output -------------------------------------------------
html_theme = "furo"
html_css_files = ["custom.css"]

# -- Options for DevPortal (Markdown) Override -------------------------------
# If we detect we are building for the devportal, we tweak the settings
if os.environ.get('BUILD_TARGET') == 'devportal':
    # Devportal-specific tweaks
    autodoc2_output_dir = "api"
    # Remove HTML-only extensions
    if "sphinx.ext.githubpages" in extensions:
        extensions.remove("sphinx.ext.githubpages")
    if "sphinx_copybutton" in extensions:
        extensions.remove("sphinx_copybutton")

# Standard Warning Suppressions
suppress_warnings = [
    "myst.xref_missing", "autodoc2.dup_item", "ref.python", 
    "ref.class", "ref.obj", "toc.excluded",
]