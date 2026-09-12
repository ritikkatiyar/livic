import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView as RNScrollView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { createStyles } from './TenantDetailsCard.styles';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface UnitBlock {
  id: string;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  activeLeaseId?: string;
  tenantUserId?: string;
  tenantPhone?: string | null;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  capacity?: number;
  activeLeases?: any[];
  type?: string;
}

interface TenantDetailsCardProps {
  selectedBlock: UnitBlock;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  onRemoveTenant: (leaseId: string, tenantName: string) => void;
  // Hook bindings
  tenantPhoneSearch: string;
  setTenantPhoneSearch: (val: string) => void;
  tenantSearchResult: any;
  setTenantSearchResult: (val: any) => void;
  tenantSearchLoading: boolean;
  tenantAssigning: boolean;
  tenantSearchError: string | null;
  setTenantSearchError: (val: string | null) => void;
  suggestions: any[];
  setSuggestions: (val: any[]) => void;
  suggestionsLoading: boolean;
  isCreatingNewTenant: boolean;
  setIsCreatingNewTenant: (val: boolean) => void;
  newTenantName: string;
  setNewTenantName: (val: string) => void;
  newTenantEmail: string;
  setNewTenantEmail: (val: string) => void;
  tenantCreating: boolean;
  rentAmount: string;
  setRentAmount: (val: string) => void;
  securityDeposit: string;
  setSecurityDeposit: (val: string) => void;
  handleSearchTenant: () => void;
  handleCreateAndSelectTenant: () => void;
  handleAssignTenant: () => void;
  resetTenantAssignmentForm: () => void;
  parentScrollEnabled?: boolean;
  setParentScrollEnabled?: (val: boolean) => void;
}

export function TenantDetailsCard({
  selectedBlock,
  updateUnitDetails,
  onRemoveTenant,
  tenantPhoneSearch,
  setTenantPhoneSearch,
  tenantSearchResult,
  setTenantSearchResult,
  tenantSearchLoading,
  tenantAssigning,
  tenantSearchError,
  setTenantSearchError,
  suggestions,
  setSuggestions,
  suggestionsLoading,
  isCreatingNewTenant,
  setIsCreatingNewTenant,
  newTenantName,
  setNewTenantName,
  newTenantEmail,
  setNewTenantEmail,
  tenantCreating,
  rentAmount,
  setRentAmount,
  securityDeposit,
  setSecurityDeposit,
  handleSearchTenant,
  handleCreateAndSelectTenant,
  handleAssignTenant,
  resetTenantAssignmentForm,
  parentScrollEnabled = true,
  setParentScrollEnabled = () => {},
}: TenantDetailsCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <>
      {isCreatingNewTenant ? (
        /* Full-panel Create New Tenant form */
        <View style={styles.createTenantPanel}>
          <View style={styles.createTenantHeader}>
            <TouchableOpacity onPress={() => setIsCreatingNewTenant(false)} style={styles.createTenantBack}>
              <MaterialIcons name="arrow-back" size={18} color={theme.Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.createTenantTitle}>CREATE NEW TENANT</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.Colors.glassFill }]}>
              <MaterialIcons name="phone" size={18} color={theme.Colors.onSurfaceVariant} />
              <TextInput style={[styles.textInput, { color: theme.Colors.onSurfaceVariant }]} value={tenantPhoneSearch} editable={false} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person" size={18} color={theme.Colors.primary} />
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. John Doe" 
                placeholderTextColor={theme.Colors.onSurfaceVariant} 
                value={newTenantName} 
                onChangeText={setNewTenantName} 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="email" size={18} color={theme.Colors.primary} />
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. john@example.com" 
                placeholderTextColor={theme.Colors.onSurfaceVariant} 
                value={newTenantEmail} 
                onChangeText={setNewTenantEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
              />
            </View>
          </View>

          {tenantSearchError && (
            <Text style={styles.errorText}>{tenantSearchError}</Text>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: theme.Spacing.md }}>
            <TouchableOpacity style={[styles.statusToggle, { flex: 1 }]} onPress={() => setIsCreatingNewTenant(false)}>
              <Text style={styles.statusToggleText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statusToggle, styles.statusActiveOccupied, { flex: 1 }]} onPress={handleCreateAndSelectTenant} disabled={tenantCreating}>
              {tenantCreating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.statusToggleText, styles.statusTextActive]}>CREATE & ASSIGN</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Normal unit fields */
        <>
          <View style={{ gap: 12, marginBottom: 12 }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UNIT TYPE</Text>
              <GlassDropdown
                options={UNIT_TYPE_OPTIONS}
                value={selectedBlock.type || 'ONE_BHK'}
                onChange={(val) => updateUnitDetails(selectedBlock.id, { type: val })}
                placeholder="Select Unit Type"
                icon="home"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
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
                    placeholderTextColor={theme.Colors.onSurfaceVariant}
                    editable={!selectedBlock.activeLeases || selectedBlock.activeLeases.length === 0}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Assigned Tenants */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ASSIGNED TENANTS</Text>
            {selectedBlock.activeLeases && selectedBlock.activeLeases.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 12 }}>
                {selectedBlock.activeLeases.map((l, index) => (
                  <View key={l.leaseId || index} style={styles.tenantListContainer}>
                    <View style={{ flex: 1, gap: theme.Spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm, flexWrap: 'wrap' }}>
                        <View style={styles.tenantTag}>
                          <Text style={styles.tenantTagText}>{l.tenantName || 'Assigned tenant'}</Text>
                        </View>
                        {l.tenantPhone ? (
                          <Text style={styles.sheetSubtitle}>{l.tenantPhone}</Text>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity 
                      onPress={() => onRemoveTenant(l.leaseId, l.tenantName)}
                      style={styles.removeTenantButton}
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
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={18} color={theme.Colors.tertiary} />
                <Text style={[styles.warningText, { color: theme.Colors.tertiary }]}>
                  Unit is fully occupied (Capacity: {selectedBlock.capacity}/{selectedBlock.capacity} reached).
                </Text>
              </View>
            ) : (
              <>
                {!isCreatingNewTenant && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="phone" size={18} color={theme.Colors.primary} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Search by 10-digit phone"
                        placeholderTextColor={theme.Colors.onSurfaceVariant}
                        value={tenantPhoneSearch}
                        onChangeText={(val) => {
                          const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
                          setTenantPhoneSearch(cleaned);
                          setTenantSearchError(null);
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

                    {/* Suggestions List */}
                    {suggestions.length > 0 && (
                      <RNScrollView 
                        style={styles.suggestionsContainer} 
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        onTouchStart={() => setParentScrollEnabled(false)}
                        onTouchEnd={() => setParentScrollEnabled(true)}
                        onTouchCancel={() => setParentScrollEnabled(true)}
                      >
                        {suggestions.map((userItem) => (
                          <TouchableOpacity
                            key={userItem.id}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setTenantSearchResult(userItem);
                              setTenantPhoneSearch(userItem.phoneNumber || '');
                              setSuggestions([]);
                            }}
                          >
                            <MaterialIcons name="phone" size={16} color={theme.Colors.primary} />
                            <View style={styles.suggestionTextContainer}>
                              <Text style={styles.suggestionName}>{userItem.fullName}</Text>
                              <Text style={styles.suggestionPhone}>{userItem.phoneNumber || 'No phone'}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </RNScrollView>
                    )}
                  </View>
                )}

                {tenantSearchError && (
                  <Text style={styles.errorTextFlat}>
                    {tenantSearchError}
                  </Text>
                )}

                {/* Quick Create Prompt */}
                {(!tenantSearchResult && !isCreatingNewTenant && tenantPhoneSearch.trim().length >= 10 && !tenantSearchLoading && suggestions.length === 0) && (
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
                        No tenant found. Create new tenant for &quot;{tenantPhoneSearch}&quot;?
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Quick Create Form */}
                {isCreatingNewTenant && (
                  <View style={styles.quickCreateForm}>
                    <Text style={styles.quickCreateTitle}>NEW TENANT DETAILS</Text>
                    
                    <View style={styles.quickCreateField}>
                      <Text style={styles.quickCreateLabel}>PHONE NUMBER</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: theme.Colors.glassFill }]}>
                        <MaterialIcons name="phone" size={18} color={theme.Colors.onSurfaceVariant} />
                        <TextInput
                          style={[styles.textInput, { color: theme.Colors.onSurfaceVariant }]}
                          value={tenantPhoneSearch}
                          editable={false}
                        />
                      </View>
                    </View>

                    <View style={styles.quickCreateField}>
                      <Text style={styles.quickCreateLabel}>FULL NAME</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialIcons name="person" size={18} color={theme.Colors.primary} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. John Doe"
                          placeholderTextColor={theme.Colors.onSurfaceVariant}
                          value={newTenantName}
                          onChangeText={setNewTenantName}
                        />
                      </View>
                    </View>

                    <View style={styles.quickCreateField}>
                      <Text style={styles.quickCreateLabel}>EMAIL ADDRESS</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialIcons name="email" size={18} color={theme.Colors.primary} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. john@example.com"
                          placeholderTextColor={theme.Colors.onSurfaceVariant}
                          value={newTenantEmail}
                          onChangeText={setNewTenantEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: theme.Spacing.sm }}>
                      <TouchableOpacity
                        style={[styles.statusToggle, { flex: 1 }]}
                        onPress={() => setIsCreatingNewTenant(false)}
                      >
                        <Text style={styles.statusToggleText}>CANCEL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusToggle, styles.statusActiveOccupied, { flex: 1 }]}
                        onPress={handleCreateAndSelectTenant}
                        disabled={tenantCreating}
                      >
                        {tenantCreating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={[styles.statusToggleText, styles.statusTextActive]}>CREATE & ASSIGN</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {tenantSearchResult && (
                  <View style={{ gap: 10, marginTop: theme.Spacing.xs, marginBottom: 12 }}>
                    <View style={styles.tenantMatchBox}>
                      <View>
                        <Text style={styles.tenantMatchName}>{tenantSearchResult.fullName}</Text>
                        <Text style={styles.tenantMatchEmail}>{tenantSearchResult.email}</Text>
                      </View>
                      <MaterialIcons name="check-circle" size={20} color={theme.Colors.tertiary} />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>LEASE RENT (₹)</Text>
                        <View style={[styles.inputWrapper, { height: 42 }]}>
                          <TextInput 
                            style={styles.textInput}
                            placeholder="e.g. 15000"
                            placeholderTextColor={theme.Colors.onSurfaceVariant}
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
                            placeholderTextColor={theme.Colors.onSurfaceVariant}
                            value={securityDeposit}
                            onChangeText={setSecurityDeposit}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.statusToggle, styles.statusActiveOccupied, { marginHorizontal: 0, paddingVertical: 14, borderRadius: 16 }]}
                      onPress={() => handleAssignTenant()}
                      disabled={tenantAssigning}
                    >
                      {tenantAssigning ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[styles.statusToggleText, styles.statusTextActive]}>
                          Assign {tenantSearchResult.fullName}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </>
      )}
    </>
  );
}
