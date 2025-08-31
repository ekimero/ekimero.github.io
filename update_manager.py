#!/usr/bin/env python3
"""
Ekimero Update Manager
======================
A Python script to automatically add new updates to both history.html and index.html files.

Usage:
    python update_manager.py add "Title" "Description" --type feature --stations "駅1,駅2,駅3"
    python update_manager.py add "Bug fixes" "Fixed multiple issues" --type bugfix
    python update_manager.py add "準備中の機能" "近日公開予定" --type preparation
    python update_manager.py list
    python update_manager.py preview "Title" "Description" --type content

Author: Ekimero Team
"""

import argparse
import re
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import sys

class EkimeroUpdateManager:
    def __init__(self):
        self.update_types = {
            'content': {
                'name': 'メロディー更新',
                'color': '#ff9800',
                'bg_color': '#fff3e0',
                'text_color': '#e65100',
                'icon': '🎵'
            },
            'feature': {
                'name': '機能追加・変更',
                'color': '#9c27b0',
                'bg_color': '#f3e5f5',
                'text_color': '#7b1fa2',
                'icon': '⚡'
            },
            'bugfix': {
                'name': 'バグ修正',
                'color': '#4caf50',
                'bg_color': '#e8f5e8',
                'text_color': '#2e7d32',
                'icon': '🔧'
            },
            'system': {
                'name': 'システム更新',
                'color': '#2196f3',
                'bg_color': '#e3f2fd',
                'text_color': '#1976d2',
                'icon': '🔄'
            },
            'preparation': {
                'name': '準備中',
                'color': '#9e9e9e',
                'bg_color': '#f5f5f5',
                'text_color': '#616161',
                'icon': '⏳'
            }
        }
        
        self.current_dir = Path.cwd()
        self.history_file = self.current_dir / 'history.html'
        self.index_file = self.current_dir / 'index.html'
        self.updates_log = self.current_dir / 'updates_log.json'
        
        # Load existing updates log
        self.load_updates_log()
    
    def load_updates_log(self):
        """Load existing updates from JSON log file."""
        if self.updates_log.exists():
            try:
                with open(self.updates_log, 'r', encoding='utf-8') as f:
                    self.updates = json.load(f)
            except json.JSONDecodeError:
                self.updates = []
        else:
            self.updates = []
    
    def save_updates_log(self):
        """Save updates to JSON log file."""
        with open(self.updates_log, 'w', encoding='utf-8') as f:
            json.dump(self.updates, f, ensure_ascii=False, indent=2)
    
    def add_update(self, title: str, description: str, update_type: str = 'content', 
                   stations: Optional[List[str]] = None, tags: Optional[List[str]] = None,
                   date: Optional[str] = None):
        """Add a new update to both history.html and index.html."""
        
        if update_type not in self.update_types:
            raise ValueError(f"Invalid update type: {update_type}. Must be one of: {list(self.update_types.keys())}")
        
        # Use current date if not provided
        if date is None:
            date = datetime.now().strftime('%Y/%m/%d')
        
        # Create update object
        update = {
            'id': len(self.updates) + 1,
            'date': date,
            'title': title,
            'description': description,
            'type': update_type,
            'stations': stations or [],
            'tags': tags or [],
            'timestamp': datetime.now().isoformat()
        }
        
        # Add to updates list
        self.updates.insert(0, update)  # Add to beginning for chronological order
        
        # Update both files
        self.update_history_html(update)
        self.update_index_html(update)
        
        # Save log
        self.save_updates_log()
        
        print(f"✅ Successfully added update: {title}")
        print(f"📅 Date: {date}")
        print(f"🏷️  Type: {self.update_types[update_type]['name']}")
        
        return update
    
    def update_history_html(self, update: Dict):
        """Add update to history.html file."""
        if not self.history_file.exists():
            print(f"❌ Error: {self.history_file} not found!")
            return
        
        with open(self.history_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Generate timeline entry HTML
        timeline_entry = self.generate_timeline_entry(update)
        
        # Find insertion point (after the August 2025 month header)
        month_pattern = r'(<div class="timeline-month"[^>]*>.*?<div style="position: absolute; left: 50%; transform: translateX\(-50%\); top: -16px; background: #ff9800; color: white; padding: 8px 20px; border-radius: 20px; font-size: 1\.1em; font-weight: 600; z-index: 3; box-shadow: 0 4px 16px rgba\(255, 152, 0, 0\.3\);">\s*8月\s*</div>)'
        
        match = re.search(month_pattern, content, re.DOTALL)
        if match:
            # Insert after the month header
            insert_pos = match.end()
            updated_content = content[:insert_pos] + '\n\n' + timeline_entry + content[insert_pos:]
        else:
            print("❌ Could not find insertion point in history.html")
            return
        
        # Write updated content
        with open(self.history_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"📝 Updated {self.history_file}")
    
    def update_index_html(self, update: Dict):
        """Add update to the recent changes section in index.html."""
        if not self.index_file.exists():
            print(f"❌ Error: {self.index_file} not found!")
            return
        
        with open(self.index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Generate recent changes entry HTML
        recent_entry = self.generate_recent_entry(update)
        
        # Find insertion point (after the recent changes grid opening)
        pattern = r'(<div class="recent-changes-grid" style="display: grid; gap: 20px;">)'
        
        match = re.search(pattern, content)
        if match:
            # Insert after the grid opening
            insert_pos = match.end()
            updated_content = content[:insert_pos] + '\n' + recent_entry + content[insert_pos:]
        else:
            print("❌ Could not find insertion point in index.html")
            return
        
        # Write updated content
        with open(self.index_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"📝 Updated {self.index_file}")
    
    def generate_timeline_entry(self, update: Dict) -> str:
        """Generate HTML for timeline entry in history.html."""
        type_info = self.update_types[update['type']]
        
        # Determine if entry should be on left or right (alternate)
        is_left = len(self.updates) % 2 == 1
        
        if is_left:
            entry_html = f'''        <!-- Update Entry: {update['date']} -->
        <div class="timeline-entry" style="display: flex; align-items: center; margin-bottom: 32px; position: relative; z-index: 2;">
          <div style="flex: 1; padding-right: 32px; text-align: right;">
            <div class="update-card" style="background: white; padding: 32px; border-radius: 20px; box-shadow: 0 8px 32px rgba({self._hex_to_rgb(type_info['color'])}, 0.15); border-left: 6px solid {type_info['color']}; position: relative; transition: all 0.3s ease;" onmouseover="this.style.transform='translateX(-8px)'; this.style.boxShadow='0 12px 48px rgba({self._hex_to_rgb(type_info['color'])}, 0.2)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 8px 32px rgba({self._hex_to_rgb(type_info['color'])}, 0.15)'">'''
        else:
            entry_html = f'''        <!-- Update Entry: {update['date']} -->
        <div class="timeline-entry" style="display: flex; align-items: center; margin-bottom: 32px; position: relative; z-index: 2;">
          <div style="flex: 1; padding-right: 32px;"></div>
          <div style="width: 24px; height: 24px; background: {type_info['color']}; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 4px {type_info['color']}; z-index: 3; position: relative;"></div>
          <div style="flex: 1; padding-left: 32px;">
            <div class="update-card" style="background: white; padding: 32px; border-radius: 20px; box-shadow: 0 8px 32px rgba({self._hex_to_rgb(type_info['color'])}, 0.15); border-right: 6px solid {type_info['color']}; position: relative; transition: all 0.3s ease;" onmouseover="this.style.transform='translateX(8px)'; this.style.boxShadow='0 12px 48px rgba({self._hex_to_rgb(type_info['color'])}, 0.2)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 8px 32px rgba({self._hex_to_rgb(type_info['color'])}, 0.15)'">'''
        
        # Add header and content
        entry_html += f'''              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <span style="background: {type_info['color']}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.9em; font-weight: 600;">{type_info['name']}</span>
                <span style="color: #666; font-size: 1.1em; font-weight: 600;">{update['date']}</span>
              </div>
              <h3 style="color: {type_info['text_color']}; font-size: 1.4em; margin-bottom: 12px; font-weight: 700;">{update['title']}</h3>
              <p style="color: #555; font-size: 1.1em; line-height: 1.6; margin-bottom: 16px;">
                {update['description']}
              </p>'''
        
        # Add stations section if provided
        if update['stations']:
            stations_html = ''.join([
                f'<span style="background: {type_info["color"]}; color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.9em;">{station}</span>'
                for station in update['stations']
            ])
            entry_html += f'''              <div style="background: {type_info['bg_color']}; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 600; color: {type_info['text_color']}; margin-bottom: 8px;">🚉 変更された駅（{len(update['stations'])}駅）:</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  {stations_html}
                </div>
              </div>'''
        
        # Add tags
        tags = update['tags'] or [f"{type_info['icon']} {type_info['name']}"]
        tags_html = ''.join([
            f'<span style="background: {type_info["bg_color"]}; color: {type_info["text_color"]}; padding: 6px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 500;">{tag}</span>'
            for tag in tags
        ])
        entry_html += f'''              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                {tags_html}
              </div>
            </div>
          </div>'''
        
        # Close the timeline entry
        if is_left:
            entry_html += f'''          <div style="width: 24px; height: 24px; background: {type_info['color']}; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 4px {type_info['color']}; z-index: 3; position: relative;"></div>
          <div style="flex: 1; padding-left: 32px;"></div>
        </div>'''
        else:
            entry_html += '''        </div>'''
        
        return entry_html
    
    def generate_recent_entry(self, update: Dict) -> str:
        """Generate HTML for recent changes entry in index.html."""
        type_info = self.update_types[update['type']]
        
        entry_html = f'''      <!-- Recent Update Item: {update['date']} -->
      <div class="change-item" style="background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba({self._hex_to_rgb(type_info['color'])}, 0.2); border-left: 4px solid {type_info['color']};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span style="background: {type_info['color']}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">{type_info['name']}</span>
          <span style="color: #666; font-size: 0.9em;">{update['date']}</span>
        </div>
        <h3 style="color: {type_info['text_color']}; font-size: 1.1em; margin-bottom: 8px; font-weight: 600;">{update['title']}</h3>
        <p style="color: #555; font-size: 0.95em; line-height: 1.5; margin-bottom: 12px;">
          {update['description']}
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">'''
        
        # Add station tags if provided
        if update['stations']:
            for i, station in enumerate(update['stations'][:3]):  # Show max 3 stations
                entry_html += f'<span style="background: {type_info["bg_color"]}; color: {type_info["text_color"]}; padding: 4px 8px; border-radius: 8px; font-size: 0.8em;">{station}</span>'
            if len(update['stations']) > 3:
                entry_html += f'<span style="background: {type_info["bg_color"]}; color: {type_info["text_color"]}; padding: 4px 8px; border-radius: 8px; font-size: 0.8em;">+{len(update["stations"]) - 3}駅</span>'
        else:
            # Add default tags
            tags = update['tags'] or [f"{type_info['icon']} {type_info['name']}"]
            for tag in tags[:3]:  # Show max 3 tags
                entry_html += f'<span style="background: {type_info["bg_color"]}; color: {type_info["text_color"]}; padding: 4px 8px; border-radius: 8px; font-size: 0.8em;">{tag}</span>'
        
        entry_html += '''        </div>
      </div>'''
        
        return entry_html
    
    def _hex_to_rgb(self, hex_color: str) -> str:
        """Convert hex color to RGB values for CSS rgba."""
        hex_color = hex_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        return f"{rgb[0]}, {rgb[1]}, {rgb[2]}"
    
    def list_updates(self):
        """List all updates in the log."""
        if not self.updates:
            print("📝 No updates found in log.")
            return
        
        print(f"📋 Found {len(self.updates)} updates:")
        print("-" * 60)
        
        for i, update in enumerate(self.updates, 1):
            type_info = self.update_types[update['type']]
            print(f"{i:2d}. [{update['date']}] {type_info['name']}: {update['title']}")
            if update['stations']:
                print(f"    🚉 Stations: {', '.join(update['stations'])}")
            if update['tags']:
                print(f"    🏷️  Tags: {', '.join(update['tags'])}")
            print()
    
    def preview_update(self, title: str, description: str, update_type: str = 'content', 
                      stations: Optional[List[str]] = None, tags: Optional[List[str]] = None):
        """Preview what an update would look like without adding it."""
        print("👀 Preview of update:")
        print("=" * 50)
        
        type_info = self.update_types[update_type]
        date = datetime.now().strftime('%Y/%m/%d')
        
        print(f"📅 Date: {date}")
        print(f"🏷️  Type: {type_info['name']} ({type_info['icon']})")
        print(f"📝 Title: {title}")
        print(f"📄 Description: {description}")
        
        if stations:
            print(f"🚉 Stations ({len(stations)}): {', '.join(stations)}")
        
        if tags:
            print(f"🏷️  Tags: {', '.join(tags)}")
        
        print("\n✨ This update would be added to both history.html and index.html")

def main():
    parser = argparse.ArgumentParser(description='Ekimero Update Manager')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Add command
    add_parser = subparsers.add_parser('add', help='Add a new update')
    add_parser.add_argument('title', help='Update title')
    add_parser.add_argument('description', help='Update description')
    add_parser.add_argument('--type', choices=['content', 'feature', 'bugfix', 'system', 'preparation'], 
                           default='content', help='Update type (default: content)')
    add_parser.add_argument('--stations', help='Comma-separated list of station names')
    add_parser.add_argument('--tags', help='Comma-separated list of tags')
    add_parser.add_argument('--date', help='Date in YYYY/MM/DD format (default: today)')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List all updates')
    
    # Preview command
    preview_parser = subparsers.add_parser('preview', help='Preview an update without adding it')
    preview_parser.add_argument('title', help='Update title')
    preview_parser.add_argument('description', help='Update description')
    preview_parser.add_argument('--type', choices=['content', 'feature', 'bugfix', 'system', 'preparation'], 
                               default='content', help='Update type (default: content)')
    preview_parser.add_argument('--stations', help='Comma-separated list of station names')
    preview_parser.add_argument('--tags', help='Comma-separated list of tags')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = EkimeroUpdateManager()
    
    try:
        if args.command == 'add':
            stations = args.stations.split(',') if args.stations else None
            tags = args.tags.split(',') if args.tags else None
            manager.add_update(
                title=args.title,
                description=args.description,
                update_type=args.type,
                stations=stations,
                tags=tags,
                date=args.date
            )
        
        elif args.command == 'list':
            manager.list_updates()
        
        elif args.command == 'preview':
            stations = args.stations.split(',') if args.stations else None
            tags = args.tags.split(',') if args.tags else None
            manager.preview_update(
                title=args.title,
                description=args.description,
                update_type=args.type,
                stations=stations,
                tags=tags
            )
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()