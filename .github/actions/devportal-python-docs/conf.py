import sys
import os
from pathlib import Path

# --- DYNAMIC PATH LOGIC ---
# If USER_SRC is set by the action, use it. Otherwise, assume we are in the repo root.
user_src_root = Path(os.environ.get('USER_SRC', Path(__file__).parents[3]))
# Add the src folder to path so autodoc can find the package
sys.path.insert(0, str(user_src_root / "src"))

# If you have custom extensions in the action folder, add that too
sys.path.insert(0, str(Path(__file__).parent)) 
# --------------------------

project = "algokit-subscriber"

exclude_patterns = ["_build", "Thumbs.db", ".DS_Store", "apidocs", "guides"]

extensions = [
    "myst_parser",
    "autodoc2",
    "sphinx.ext.doctest",
    "devportal", 
]

autodoc2_packages = [
    {
        # Point directly to the package inside the user's src directory
        "path": str(user_src_root / "src" / "algokit_subscriber"),
        "auto_mode": True,
    },
]

autodoc2_render_plugin = "myst"
autodoc2_hidden_objects = ["private"]
add_module_names = False
autodoc2_index_template = None
autodoc2_output_dir = "api"

# Suppress more warnings for markdown output
suppress_warnings = [
    "myst.xref_missing",
    "autodoc2.dup_item",
    "ref.python",
    "ref.class",
    "ref.obj",
    "toc.excluded",
]