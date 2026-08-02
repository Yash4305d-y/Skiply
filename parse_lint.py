import json

try:
    with open('eslint-report.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
        for file in data:
            if file['messages']:
                print(f"\n{file['filePath']}")
                for msg in file['messages']:
                    print(f"  {msg.get('line')}:{msg.get('column')} {msg.get('severity')} {msg.get('message')} ({msg.get('ruleId')})")
except Exception as e:
    print("Error:", e)
