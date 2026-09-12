import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { UnitBlock } from '../hooks/useFloorLayoutViewer';
import { createStyles } from './TenantDetailsSidebar.styles';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface TenantDetailsSidebarProps {
  selectedBlock: UnitBlock;
  floorNumber: number;
  onClose: () => void;
  sheetScrollRef: React.RefObject<ScrollView>;
  isCreatingNewTenant: boolean;
  setIsCreatingNewTenant: (val: boolean) => void;
  tenantPhoneSearch: string;
  setTenantPhoneSearch: (val: string) => void;
  newTenantName: string;
  setNewTenantName: (val: string) => void;
  newTenantEmail: string;
  setNewTenantEmail: (val: string) => void;
  tenantSearchError: string | null;
  tenantCreating: boolean;
  parentScrollEnabled: boolean;
  setParentScrollEnabled: (val: boolean) => void;
  handleCreateAndSelectTenant: () => void;
  handleSearchTenant: () => void;
  tenantSearchLoading: boolean;
  suggestions: any[];
  setSuggestions: (val: any[]) => void;
  setTenantSearchResult: (val: any) => void;
  tenantSearchResult: any;
  rentAmount: string;
  setRentAmount: (val: string) => void;
  securityDeposit: string;
  setSecurityDeposit: (val: string) => void;
  handleAssignTenant: () => void;
  tenantAssigning: boolean;
  handleRemoveTenant: (leaseId: string, tenantName?: string | null) => void;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  isDesktop?: boolean;
}

export function TenantDetailsSidebar({
  selectedBlock,
  floorNumber,
  onClose,
  sheetScrollRef,
  isCreatingNewTenant,
  setIsCreatingNewTenant,
  tenantPhoneSearch,
  setTenantPhoneSearch,
  newTenantName,
  setNewTenantName,
  newTenantEmail,
  setNewTenantEmail,
  tenantSearchError,
  tenantCreating,
  parentScrollEnabled,
  setParentScrollEnabled,
  handleCreateAndSelectTenant,
  handleSearchTenant,
  tenantSearchLoading,
  suggestions,
  setSuggestions,
  setTenantSearchResult,
  tenantSearchResult,
  rentAmount,
  setRentAmount,
  securityDeposit,
  setSecurityDeposit,
  handleAssignTenant,
  tenantAssigning,
  handleRemoveTenant,
  updateUnitDetails,
  isDesktop = false,
}: TenantDetailsSidebarProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={[styles.desktopCard, { flex: 1 }]}>
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetUnitTitle}>Unit {selectedBlock.unitNumber}</Text>
          <Text style={styles.sheetSubtitle}>Floor {floorNumber}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButtonSmall}>
          <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={sheetScrollRef}
        scrollEnabled={parentScrollEnabled}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isCreatingNewTenant ? (
          <View style={styles.createTenantPanel}>
            <View style={styles.createTenantHeader}>
              <TouchableOpacity onPress={() => setIsCreatingNewTenant(false)} style={styles.createTenantBack}>
                <MaterialIcons name="arrow-back" size={18} color={theme.Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.createTenantTitle}>CREATE NEW TENANT</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialIcons name="phone" size={18} color={theme.Colors.onSurfaceVariant} />
                <TextInput style={[styles.textInput, { color: theme.Colors.onSurfaceVariant }]} value={tenantPhoneSearch} editable={false} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={18} color={theme.Colors.primary} />
                <TextInput style={styles.textInput} placeholder="e.g. John Doe" placeholderTextColor={theme.Colors.outlineVariant} value={newTenantName} onChangeText={setNewTenantName} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={18} color={theme.Colors.primary} />
                <TextInput style={styles.textInput} placeholder="e.g. john@example.com" placeholderTextColor={theme.Colors.outlineVariant} value={newTenantEmail} onChangeText={setNewTenantEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>

            {tenantSearchError && (
              <Text style={{ color: theme.Colors.error, fontSize: theme.Typography.bodyMedium.fontSize, paddingLeft: theme.Spacing.xs, marginTop: theme.Spacing.xs }}>{tenantSearchError}</Text>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: theme.Spacing.md }}>
              <TouchableOpacity style={styles.cancelTenantBtn} onPress={() => setIsCreatingNewTenant(false)}>
                <Text style={styles.cancelTenantBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createAssignBtn} onPress={handleCreateAndSelectTenant} disabled={tenantCreating}>
                {tenantCreating ? <ActivityIndicator size="small" color={theme.Colors.onPrimary} /> : <Text style={styles.createAssignBtnText}>CREATE & ASSIGN</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={{ gap: 12, marginBottom: 12 }}>
              <View style={[styles.inputGroup]}>
                <Text style={styles.inputLabel}>UNIT CAPACITY</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="people" size={18} color={theme.Colors.primary} />
                  <TextInput 
                    style={styles.textInput}
                    value={selectedBlock.capacity ? selectedBlock.capacity.toString() : ''}
                    onChangeText={(val) => {
                      const cap = parseInt(val, 10);
                      updateUnitDetails(selectedBlock.id, { capacity: isNaN(cap) ? undefined : cap });
                    }}
                    placeholder="e.g. 2"
                    keyboardType="numeric"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    editable={!selectedBlock.activeLeases || selectedBlock.activeLeases.length === 0}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ASSIGNED TENANTS</Text>
              {selectedBlock.activeLeases && selectedBlock.activeLeases.length > 0 ? (
                <View style={{ gap: 10, marginBottom: 12 }}>
                  {selectedBlock.activeLeases.map((l, index) => (
                    <View key={l.leaseId || index} style={[styles.tenantListContainer]}>
                      <View style={{ flex: 1, gap: theme.Spacing.xs }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm, flexWrap: 'wrap' }}>
                          <View style={styles.tenantTag}>
                            <Text style={styles.tenantTagText}>{l.tenantName || 'Assigned tenant'}</Text>
                          </View>
                          {l.tenantPhone ? (
                            <Text style={[styles.sheetSubtitle, { marginVertical: 0 }]}>{l.tenantPhone}</Text>
                          ) : null}
                        </View>
                      </View>

                      <TouchableOpacity 
                        onPress={() => handleRemoveTenant(l.leaseId, l.tenantName)}
                        style={styles.removeBtn}
                      >
                        <MaterialIcons name="close" size={16} color={theme.Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.sheetSubtitle, { marginBottom: theme.Spacing.sm, fontStyle: 'italic' }]}>No tenants assigned yet.</Text>
              )}

              {(!selectedBlock.capacity || selectedBlock.capacity <= 0) ? (
                <View style={styles.warningContainer}>
                  <MaterialIcons name="warning" size={18} color={theme.Colors.error} />
                  <Text style={styles.warningText}>
                    Please define a unit capacity of at least 1 before you can search for and assign tenants.
                  </Text>
                </View>
              ) : selectedBlock.activeLeases && selectedBlock.activeLeases.length >= selectedBlock.capacity ? (
                <View style={[styles.warningContainer, { backgroundColor: 'rgba(46, 125, 50, 0.08)', borderColor: 'rgba(46, 125, 50, 0.15)', marginTop: theme.Spacing.sm }]}>
                  <MaterialIcons name="check-circle" size={18} color={theme.Colors.primary} />
                  <Text style={[styles.warningText, { color: theme.Colors.primary }]}>
                    Unit is fully occupied (Capacity: {selectedBlock.capacity}/{selectedBlock.capacity} reached).
                  </Text>
                </View>
              ) : (
                <>
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="phone" size={18} color={theme.Colors.primary} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Search by 10-digit phone"
                        placeholderTextColor={theme.Colors.outlineVariant}
                        value={tenantPhoneSearch}
                        onChangeText={(val) => {
                          const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
                          setTenantPhoneSearch(cleaned);
                        }}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onSubmitEditing={handleSearchTenant}
                      />
                      <TouchableOpacity onPress={handleSearchTenant} disabled={tenantSearchLoading}>
                        {tenantSearchLoading ? (
                          <ActivityIndicator size="small" color={theme.Colors.primary} />
                        ) : (
                          <MaterialIcons name="person-add" size={20} color={theme.Colors.primary} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {suggestions.length > 0 && (
                      <ScrollView 
                        style={styles.suggestionsContainer} 
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        onTouchStart={() => setParentScrollEnabled(false)}
                        onTouchEnd={() => setParentScrollEnabled(true)}
                        onTouchCancel={() => setParentScrollEnabled(true)}
                      >
                        {suggestions.map((user) => (
                          <TouchableOpacity
                            key={user.id}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setTenantSearchResult(user);
                              setTenantPhoneSearch(user.phoneNumber || '');
                              setSuggestions([]);
                            }}
                          >
                            <MaterialIcons name="phone" size={16} color={theme.Colors.primary} />
                            <View style={styles.suggestionTextContainer}>
                              <Text style={styles.suggestionName}>{user.fullName}</Text>
                              <Text style={styles.suggestionPhone}>{user.phoneNumber || 'No phone'}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {tenantSearchError && (
                    <Text style={{ color: theme.Colors.error, fontSize: theme.Typography.bodyMedium.fontSize, marginTop: -8, marginBottom: 12, paddingLeft: theme.Spacing.xs }}>
                      {tenantSearchError}
                    </Text>
                  )}

                  {(!tenantSearchResult && tenantPhoneSearch.trim().length >= 10 && !tenantSearchLoading && suggestions.length === 0) && (
                    <TouchableOpacity
                      style={styles.quickCreatePrompt}
                      onPress={() => {
                        setIsCreatingNewTenant(true);
                        setNewTenantName('');
                        setNewTenantEmail('');
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <MaterialIcons name="person-add" size={20} color={theme.Colors.primary} />
                        <Text style={styles.quickCreatePromptText}>
                          {'No tenant found. Create new tenant for "'}{tenantPhoneSearch}{'"?'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {tenantSearchResult && (
                    <View style={{ gap: 10, marginTop: theme.Spacing.xs, marginBottom: 12 }}>
                      <View style={styles.searchResultContainer}>
                        <View>
                          <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700', color: theme.Colors.primary }}>{tenantSearchResult.fullName}</Text>
                          <Text style={{ fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant }}>{tenantSearchResult.email}</Text>
                        </View>
                        <MaterialIcons name="check-circle" size={20} color={theme.Colors.primary} />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>LEASE RENT (₹)</Text>
                          <View style={[styles.inputWrapper, { height: 42 }]}>
                            <TextInput 
                              style={styles.textInput}
                              placeholder="e.g. 15000"
                              placeholderTextColor={theme.Colors.outlineVariant}
                              value={rentAmount}
                              onChangeText={setRentAmount}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>DEPOSIT (₹)</Text>
                          <View style={[styles.inputWrapper, { height: 42 }]}>
                            <TextInput 
                              style={styles.textInput}
                              placeholder="e.g. 30000"
                              placeholderTextColor={theme.Colors.outlineVariant}
                              value={securityDeposit}
                              onChangeText={setSecurityDeposit}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => handleAssignTenant()}
                        disabled={tenantAssigning}
                        activeOpacity={0.8}
                      >
                        {tenantAssigning ? (
                          <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                        ) : (
                          <Text style={styles.saveButtonText}>
                            Assign {tenantSearchResult.fullName}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.statusContainer}>
              <TouchableOpacity 
                style={[
                  styles.statusToggle, 
                  selectedBlock.status === 'VACANT' && styles.statusActiveVacant,
                  Boolean(selectedBlock.activeLeaseId) && styles.statusDisabled,
                ]}
                onPress={() => updateUnitDetails(selectedBlock.id, { status: 'VACANT' })}
                disabled={Boolean(selectedBlock.activeLeaseId)}
              >
                {selectedBlock.status === 'VACANT' && <View style={styles.statusDotVacant} />}
                <Text style={[styles.statusToggleText, selectedBlock.status === 'VACANT' && styles.statusTextVacant]}>VACANT</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.statusToggle, 
                  selectedBlock.status === 'OCCUPIED' && styles.statusActiveOccupied,
                  Boolean(selectedBlock.activeLeaseId) && styles.statusDisabled,
                ]}
                onPress={() => updateUnitDetails(selectedBlock.id, { status: 'OCCUPIED' })}
                disabled={Boolean(selectedBlock.activeLeaseId)}
              >
                {selectedBlock.status === 'OCCUPIED' && <View style={styles.statusDotOccupied} />}
                <Text style={[styles.statusToggleText, selectedBlock.status === 'OCCUPIED' && styles.statusTextOccupied]}>OCCUPIED</Text>
              </TouchableOpacity>
            </View>
            {Boolean(selectedBlock.activeLeaseId) && (
              <View style={styles.statusLockedHint}>
                <MaterialIcons name="lock-outline" size={12} color={theme.Colors.onSurfaceVariant} />
                <Text style={styles.statusLockedText}>Status synced with active lease</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
