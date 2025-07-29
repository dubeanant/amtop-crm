# Pipeline Management Guide

## Overview
The CRM now includes a comprehensive pipeline management system that allows you to track leads through different stages of your sales process.

## Lead Stages

### 1. **Leads** (Blue)
- **Description**: New leads from CSV uploads or manual entry
- **Default Stage**: All new leads start here
- **Color**: Blue badges and indicators

### 2. **Engaged Leads** (Yellow)
- **Description**: Leads who have responded to your outreach efforts
- **Purpose**: Track leads that have shown interest or engagement
- **Future**: Will be automatically updated when leads respond to cold emails
- **Color**: Yellow badges and indicators

### 3. **Warm Leads** (Green)
- **Description**: Leads who have made small purchases or shown strong buying intent
- **Purpose**: Track leads that are close to conversion
- **Future**: Will be automatically updated when leads make purchases
- **Color**: Green badges and indicators

## How to Use the Pipeline

### Dashboard Features
1. **Pipeline Overview**: View quick stats for each stage
2. **Stage Column**: See current stage of each lead in the table
3. **Quick Actions**: Use stage buttons to move leads between stages
4. **Pipeline Link**: Click "View Full Pipeline →" to access the full pipeline view

### Pipeline Page Features
1. **Kanban View**: Visual representation of leads in different stages
2. **Drag & Drop**: Move individual leads between stages
3. **Bulk Actions**: Select multiple leads and move them together
4. **Stage Statistics**: View detailed stats for each stage
5. **Lead Details**: See full lead information in each stage

### Leads Page Features
1. **List View**: See all leads in a table format
2. **Filtering**: Filter leads by stage
3. **Search**: Search leads by name, email, or phone
4. **Stage Management**: Change lead stages directly from the list
5. **Summary Stats**: View lead distribution across stages

## Manual Lead Management

### Moving Leads to Engaged
- **When**: After you've sent cold emails and received responses
- **How**: 
  - Use quick action buttons on dashboard
  - Use stage buttons in pipeline view
  - Use action buttons in leads list
- **Current**: Manual process (click buttons)
- **Future**: Will be automated when email system is implemented

### Moving Leads to Warm
- **When**: After leads make small purchases or show strong buying intent
- **How**: Same as above - use the stage change buttons
- **Current**: Manual process
- **Future**: Will be automated when payment/purchase system is integrated

### Moving Leads Back
- **Purpose**: If you need to move leads back to previous stages
- **How**: Use the stage buttons (← Lead, ← Engaged)

## Permissions
- **View Pipeline**: Requires 'pipeline' read permission
- **Update Stages**: Requires 'pipeline' update permission
- **View Leads**: Requires 'leads' read permission
- **Delete Leads**: Requires 'leads' delete permission

## Future Enhancements

### Email Integration
- Automatic stage updates when leads respond to cold emails
- Email tracking and engagement metrics
- Bulk email campaigns with stage-based targeting

### Purchase Integration
- Automatic conversion to warm leads upon purchase
- Revenue tracking per stage
- Purchase history integration

### Analytics
- Conversion rates between stages
- Time spent in each stage
- Pipeline velocity metrics
- Revenue attribution by stage

## Navigation
- **Dashboard**: `/` - Overview with pipeline stats
- **Pipeline**: `/pipeline` - Full kanban-style pipeline view
- **Leads**: `/leads` - Detailed list view of all leads

## Tips for Effective Pipeline Management

1. **Regular Updates**: Update lead stages regularly to maintain accuracy
2. **Bulk Operations**: Use bulk selection for efficiency when managing many leads
3. **Stage Definitions**: Keep clear criteria for when to move leads between stages
4. **Review Process**: Regularly review leads in each stage to ensure proper progression
5. **Data Quality**: Maintain clean lead data for better pipeline insights

## Technical Notes
- All stage changes are tracked with timestamps and user information
- Lead stages are stored in MongoDB with the lead data
- Default stage for new leads is 'lead'
- Stage updates are logged for audit purposes